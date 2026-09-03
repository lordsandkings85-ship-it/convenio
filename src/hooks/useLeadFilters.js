import { useState, useMemo } from 'react';

export function useLeadFilters(enquiries = []) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => {
      const statusMatch = statusFilter === 'ALL' 
        ? true 
        : statusFilter === 'ACTIVE' 
          ? !['NOT_INTERESTED', 'APPROVED', 'COMPLETED'].includes(e.status)
          : statusFilter === 'CLOSED'
            ? ['NOT_INTERESTED', 'APPROVED', 'COMPLETED'].includes(e.status)
            : e.status === statusFilter;
      
      const sourceMatch = sourceFilter === 'ALL' ? true : e.source === sourceFilter;
      
      let dateMatch = true;
      if (dateFilter !== 'ALL') {
        const enquiryDate = new Date(e.created_at);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          dateMatch = enquiryDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'LAST_7_DAYS') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          dateMatch = enquiryDate >= sevenDaysAgo;
        } else if (dateFilter === 'LAST_30_DAYS') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          dateMatch = enquiryDate >= thirtyDaysAgo;
        }
      }

      const searchMatch = searchQuery.trim() === '' 
        ? true 
        : (e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           e.phone?.includes(searchQuery) || 
           e.email?.toLowerCase().includes(searchQuery.toLowerCase()));

      return statusMatch && sourceMatch && dateMatch && searchMatch;
    });
  }, [enquiries, statusFilter, sourceFilter, dateFilter, searchQuery]);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setDateFilter('ALL');
    setSearchQuery('');
  };

  return {
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateFilter,
    setDateFilter,
    searchQuery,
    setSearchQuery,
    filteredEnquiries,
    resetFilters
  };
}
