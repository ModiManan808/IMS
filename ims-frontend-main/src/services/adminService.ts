import api from '../config/api';

export interface AdminDecisionRequest {
  id: number;
  decision: 'Approved' | 'Rejected' | 'Special Approval Required';
  rejectionReason?: string;
  specialApprovalNotes?: string;
}

export interface AdminOnboardRequest {
  id: number;
  applicationNo: string;
  dateOfJoining: string;
  dateOfLeaving: string;
}

export const adminService = {
  getFreshApplications: async () => {
    return api.get('/admin/dashboard/fresh');
  },

  getPendingApplications: async () => {
    return api.get('/admin/dashboard/pending');
  },

  getOngoingInterns: async () => {
    return api.get('/admin/dashboard/ongoing');
  },

  getRejectedApplications: async () => {
    return api.get('/admin/dashboard/rejected');
  },

  getCompletedInterns: async () => {
    return api.get('/admin/dashboard/completed');
  },

  decideOnFresh: async (data: AdminDecisionRequest) => {
    return api.post('/admin/decision', data);
  },

  finalizeOnboarding: async (data: AdminOnboardRequest) => {
    return api.post('/admin/onboard', data);
  },

  getInternDetails: async (id: number) => {
    return api.get(`/admin/intern/${id}`);
  },
};
