import { supabase } from './supabase';

export async function createEnquiry(enquiryData) {
  const id = crypto.randomUUID();
  const insertData = { ...enquiryData, id };

  const { error } = await supabase
    .from('enquiries')
    .insert([insertData]);

  if (error) throw error;
  
  await supabase.from('enquiry_timeline').insert([{
    enquiry_id: id,
    action_type: 'ENQUIRY_CREATED',
    description: 'Enquiry received from customer'
  }]);

  return insertData;
}
