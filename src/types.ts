export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  profession: string | null;
  address: string | null;
  notes: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  meetingPlace: string | null;
  meetingDate: string | null;
  status: string;
  trustLevel: number | null;
  opportunityStatus: number | null;
  isRecommendable: boolean;
  recommendationNote: string | null;
  recommendationDomains: string[] | null;
  tags: string[] | null;
  potentialRevenue: number | null;
  nextAction: string | null;
  nextActionDate: string | null;
  preferredChannel: string | null;
  interests: string[] | null;
  birthday: string | null;
  languages: string[] | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  githubUrl: string | null;
  tiktokUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  department: string | null;
  departmentLabel: string | null;
  price: number;
  formattedPrice: string;
  imageUrl: string | null;
  registrationLink: string | null;
  isPublic: boolean;
  status: string;
  statusLabel: string;
  maxParticipants: number | null;
  registeredCount: number;
  isRegistrationFull: boolean;
  isUserRegistered: boolean;
  organizerName: string | null;
  organizer: { id: number; name: string; slug: string } | null;
  createdAt: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  profession: string | null;
  phone: string | null;
  roles: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
