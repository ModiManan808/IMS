import api from '../config/api';

export interface ApplicationRequest {
  fullName: string;
  enrollmentNo: string;
  email: string;
  mobile: string;
  loi: File;
}

export interface EnrollmentFormData {
  fullName: string;
  enrollmentNo: string;
  semester: string;
  program: string;
  department: string;
  organization: string;
  contactNo: string;
  emailAddress: string;
  gender: 'M' | 'F' | 'O';
  bloodGroup: string;
  presentAddress: string;
  permanentAddress: string;
  photo: File;
  sign: File;
  nda: File;
}

export interface DailyReportRequest {
  domain: string;
  workDescription: string;
  toolsUsed?: string;
  issuesFaced?: string;
}

export const internService = {
  submitApplication: async (data: ApplicationRequest) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('enrollmentNo', data.enrollmentNo);
    formData.append('email', data.email);
    formData.append('mobile', data.mobile);
    formData.append('loi', data.loi);
    return api.post('/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getEnrollmentForm: async (id: string) => {
    return api.get(`/enroll/${id}`);
  },

  submitEnrollment: async (id: string, data: EnrollmentFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, value);
      }
    });
    return api.post(`/enroll/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProfile: async () => {
    return api.get('/intern/profile');
  },

  getReports: async () => {
    return api.get('/intern/reports');
  },

  submitDailyReport: async (data: DailyReportRequest) => {
    return api.post('/intern/report', data);
  },
};
