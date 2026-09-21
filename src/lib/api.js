import { supabase } from './supabase';

// Base URL for the Groq / Resend proxy endpoints.
// Defaults to same-origin /api (Vite dev proxy / Vercel/Netlify functions).
// For static hosting (Hostinger, static Vercel/Netlify), point VITE_API_BASE
// at an external API host, e.g. https://api.example.com/api
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');


/**
 * Fetch all enquiries, optionally filtered by status
 */
export async function getEnquiries(status = null) {
  let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single enquiry by ID, including its timeline and tasks
 */
export async function getEnquiryDetails(id) {
  const [enquiryRes, timelineRes, tasksRes] = await Promise.all([
    supabase.from('enquiries').select('*').eq('id', id).single(),
    supabase.from('enquiry_timeline').select('*').eq('enquiry_id', id).order('created_at', { ascending: false }),
    supabase.from('follow_up_tasks').select('*').eq('enquiry_id', id).order('scheduled_at', { ascending: true })
  ]);

  if (enquiryRes.error) throw enquiryRes.error;
  if (timelineRes.error) throw timelineRes.error;
  if (tasksRes.error) throw tasksRes.error;

  return {
    ...enquiryRes.data,
    timeline: timelineRes.data,
    tasks: tasksRes.data
  };
}

/**
 * Create a new enquiry (typically from a public form)
 */
export async function createEnquiry(enquiryData) {
  // Generate UUID on client to avoid needing SELECT permissions on the public table
  const id = crypto.randomUUID();
  const insertData = { ...enquiryData, id };

  const { error } = await supabase
    .from('enquiries')
    .insert([insertData]);

  if (error) throw error;
  
  // Log the creation in the timeline
  await supabase.from('enquiry_timeline').insert([{
    enquiry_id: id,
    action_type: 'ENQUIRY_CREATED',
    description: 'Enquiry received from customer'
  }]);

  return insertData;
}

/**
 * Update the status of an enquiry and log it in the timeline
 */
export async function updateEnquiryStatus(id, newStatus, userId = null) {
  const { data, error } = await supabase
    .from('enquiries')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log the status change
  await supabase.from('enquiry_timeline').insert([{
    enquiry_id: id,
    action_type: 'STATUS_CHANGE',
    description: `Status changed to ${newStatus}`,
    created_by: userId
  }]);

  return data;
}

/**
 * Delete an enquiry and all its related data
 */
export async function deleteEnquiry(id) {
  // Delete related rows first to avoid FK constraint errors
  await supabase.from('enquiry_timeline').delete().eq('enquiry_id', id);
  await supabase.from('follow_up_tasks').delete().eq('enquiry_id', id);
  await supabase.from('communication_drafts').delete().eq('enquiry_id', id);

  const { error } = await supabase.from('enquiries').delete().eq('id', id);
  if (error) throw error;
}


export async function createFollowUpTask(taskData) {
  const { data, error } = await supabase
    .from('follow_up_tasks')
    .insert([taskData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch due or overdue follow-up tasks
 */
export async function getDueTasks() {
  const { data, error } = await supabase
    .from('follow_up_tasks')
    .select('*, enquiries(name)')
    .eq('status', 'PENDING')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Update task status
 */
export async function updateTaskStatus(taskId, status) {
  const { error } = await supabase
    .from('follow_up_tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw error;
}

async function callGroqAI(messages, defaultModel = 'openai/gpt-oss-120b') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  const models = [
    import.meta.env.VITE_GROQ_MODEL || defaultModel,
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-20b'
  ];

  for (const model of models) {
    // 1. Direct Groq API
    try {
      const directRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_completion_tokens: 1024,
          top_p: 1
        })
      });
      if (directRes.ok) {
        const text = await directRes.text();
        if (text && !text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }

    // 2. PHP Proxy
    try {
      const phpRes = await fetch('/api/chat.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_completion_tokens: 1024,
          top_p: 1
        })
      });
      if (phpRes.ok) {
        const text = await phpRes.text();
        if (text && !text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      }
    } catch (e) {
      // Continue to next endpoint
    }

    // 3. Serverless / Vite Dev Proxy
    try {
      const proxyRes = await fetch(`${API_BASE}/groq/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_completion_tokens: 1024,
          top_p: 1
        })
      });
      if (proxyRes.ok) {
        const text = await proxyRes.text();
        if (text && !text.trim().startsWith('<')) {
          const data = JSON.parse(text);
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }

  throw new Error('All AI completion endpoints failed');
}

/**
 * Generate email draft using Groq AI
 */
export async function generateDraftContent(enquiry, newStatus) {
  let prompt = `You are a professional franchise sales executive for Convenio Mart. 
Draft a short, polite email to a customer who has enquired about a franchise.
Customer Name: ${enquiry.name}
Location: ${enquiry.location || 'Unknown'}
`;

  if (newStatus === 'INTERESTED') {
    prompt += `The customer is interested. We are now moving them to the 'Documents Requested' stage. 
Write an email thanking them for their time on the phone, attaching the franchise brochure (mention it is attached), and asking them to reply with their basic KYC documents (Aadhar, PAN) to proceed.`;
  } else if (newStatus === 'READY_TO_PAY') {
    prompt += `The customer has submitted their documents and is ready to pay the franchise fee. 
Write an email confirming their documents are received and providing the next step, which is to make the payment. Mention that the bank account details will be sent in a separate secure message.`;
  } else if (newStatus === 'APPROVED') {
    prompt += `The customer's payment has been received and verified. Their franchise is approved!
Write a congratulatory email welcoming them to the Convenio Mart family. Mention that the onboarding team will contact them shortly for agreement signing and training.`;
  } else {
    return ""; // No automated draft for this status
  }

  prompt += `\nKeep the email professional, enthusiastic, and concise (under 150 words). Do not include placeholder brackets like [Your Name], just sign off as 'Convenio Mart Franchise Team'. Use HTML formatting with <p> and <br> tags for paragraphs.`;

  try {
    return await callGroqAI([{ role: 'user', content: prompt }]);
  } catch (error) {
    console.error("Draft generation error:", error);
    throw error;
  }
}

/**
 * Generate WhatsApp draft using Groq AI
 */
export async function generateWhatsAppContent(enquiry, newStatus) {
  let prompt = `You are a professional franchise sales executive for Convenio Mart. 
Write a short, friendly WhatsApp message to a customer who has enquired about a franchise.
Customer Name: ${enquiry.name}
Location: ${enquiry.location || 'Unknown'}
`;

  if (newStatus === 'INTERESTED') {
    prompt += `The customer is interested. We are moving them to the 'Documents Requested' stage. 
Write a WhatsApp message thanking them for their time, telling them the brochure has been sent to their email, and asking them to reply here with photos of their basic KYC documents (Aadhar, PAN) to proceed.`;
  } else if (newStatus === 'READY_TO_PAY') {
    prompt += `The customer has submitted documents and is ready to pay. 
Write a WhatsApp message confirming their documents are received and providing the next step, which is payment. Include the following fake bank details for them to transfer to:
Bank: State Bank of India
A/c: 38472938475
IFSC: SBIN0001234`;
  } else if (newStatus === 'APPROVED') {
    prompt += `Their franchise is approved!
Write an enthusiastic WhatsApp message welcoming them to the Convenio Mart family. Mention the onboarding team will call them shortly.`;
  } else {
    return ""; 
  }

  prompt += `\nKeep the message highly conversational, enthusiastic, and very concise (under 50 words). Use emojis. Do not include placeholder brackets, just sign off as 'Convenio Mart'. Do NOT use HTML formatting, use standard WhatsApp text formatting (like *bold*).`;

  try {
    return await callGroqAI([{ role: 'user', content: prompt }]);
  } catch (error) {
    console.error("WhatsApp generation error:", error);
    return "";
  }
}

/**
 * Save draft to database
 */
export async function saveCommunicationDraft(draftData) {
  const { data, error } = await supabase
    .from('communication_drafts')
    .insert([draftData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Send Email via Resend / PHP Proxy
 */
export async function sendEmail(to, subject, htmlContent) {
  // 1. Try PHP Proxy
  try {
    const phpRes = await fetch('/api/send-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html: htmlContent
      })
    });
    if (phpRes.ok) {
      const text = await phpRes.text();
      if (!text.trim().startsWith('<')) {
        return JSON.parse(text);
      }
    }
  } catch (e) {
    // Continue
  }

  // 2. Try Serverless / Dev Proxy
  const response = await fetch(`${API_BASE}/resend/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Convenio Mart <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to send email');
  }
  return await response.json();
}

/**
 * Fetch all communication templates
 */
export async function getTemplates() {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Create or Update a template
 */
export async function saveTemplate(templateData) {
  // If id starts with 'sys_' it means it was a default template that hasn't been saved to DB yet
  // We need to strip it out so Supabase generates a real UUID, UNLESS we specifically want to keep the string ID.
  // Wait, Supabase UUID column will reject 'sys_email_ready'.
  // We should let Supabase generate the ID and just rely on `status_trigger` and `type` to identify system templates.
  
  const payload = {
    type: templateData.type,
    name: templateData.name,
    body: templateData.body,
    attachment_url: templateData.attachment_url,
    is_system: templateData.isSystem || false,
    status_trigger: templateData.statusTrigger || null
  };

  if (templateData.id && !templateData.id.startsWith('sys_')) {
    payload.id = templateData.id;
  }

  const { data, error } = await supabase
    .from('templates')
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a template
 */
export async function deleteTemplate(id) {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch blog posts, optionally only published ones
 */
export async function getBlogPosts({ publishedOnly = false } = {}) {
  let query = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

  if (publishedOnly) {
    query = query.eq('status', 'PUBLISHED');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single published blog post by slug
 */
export async function getBlogPostBySlug(slug) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create or Update a blog post
 */
export async function saveBlogPost(postData) {
  const payload = {
    title: postData.title,
    slug: postData.slug,
    excerpt: postData.excerpt || null,
    content: postData.content,
    cover_image: postData.cover_image || null,
    author: postData.author || null,
    status: postData.status || 'DRAFT'
  };

  if (postData.id) {
    payload.id = postData.id;
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .upsert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Upload an image (blog cover or inline content image) to Supabase Storage
 * and return its public URL.
 */
export async function uploadBlogImage(file) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${ext}`
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

