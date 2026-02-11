import React from 'react';
import { AgentLandingPage } from '../../components/AgentLandingPage';
import { Language } from '../../types';

interface CoursesLandingPageProps {
  language: Language;
}

const CoursesLandingPage: React.FC<CoursesLandingPageProps> = ({ language }) => {
  return <AgentLandingPage type="courses" language={language} />;
};

export default CoursesLandingPage;
