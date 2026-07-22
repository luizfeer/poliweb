export type DiaryAct = {
  id: string;
  title: string;
  actType: string | null;
  summaryAi: string | null;
  rawText: string | null;
  importance: string | null;
};

export type OfficialDiary = {
  id: string;
  date: string;
  number: string | null;
  sourceUrl: string | null;
  pages: number | null;
  acts: DiaryAct[];
};

export type CouncilMeeting = {
  id: string;
  date: string;
  sessionType: string | null;
  sourceUrl: string | null;
  summaryAi: string | null;
};

export type PublicTender = {
  id: string;
  number: string | null;
  title: string;
  modality: string | null;
  status: string | null;
  deadline: string | null;
  estimatedValue: number | null;
  sourceUrl: string | null;
  rawText: string | null;
  summaryAi: string | null;
};

export type CivicNews = {
  id: string;
  source: 'city_hall' | 'council';
  title: string;
  excerpt: string | null;
  summaryAi: string | null;
  rawText: string | null;
  sourceUrl: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
};

export type CouncilProposition = {
  id: string;
  propositionType: string | null;
  number: string | null;
  title: string;
  author: string | null;
  situation: string | null;
  presentedAt: string | null;
  summaryAi: string | null;
  sourceUrl: string;
  downloadUrl: string | null;
};

export type TransparencySnapshot = {
  diaries: OfficialDiary[];
  meetings: CouncilMeeting[];
  tenders: PublicTender[];
  councilNews: CivicNews[];
  cityHallNews: CivicNews[];
  propositions: CouncilProposition[];
};
