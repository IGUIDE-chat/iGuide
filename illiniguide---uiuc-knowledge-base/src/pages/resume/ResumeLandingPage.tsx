import React from 'react';
import { AgentLandingPage } from '../../components/AgentLandingPage';
import { Language } from '../../types';

interface ResumeLandingPageProps {
  language: Language;
}

const ResumeLandingPage: React.FC<ResumeLandingPageProps> = ({ language }) => {
  return <AgentLandingPage type="resume" language={language} />;
};

export default ResumeLandingPage;
