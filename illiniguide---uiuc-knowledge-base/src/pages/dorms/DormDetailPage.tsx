import React from 'react';
import DormDetail from '../../components/housing/DormDetail';
import AIChat from '../../components/housing/AIChat';
import { Language } from '../../types';

interface DormDetailPageProps {
  language: Language;
}

const DormDetailPage: React.FC<DormDetailPageProps> = ({ language }) => {
  return (
    <>
      <DormDetail language={language} />
      <AIChat language={language} />
    </>
  );
};

export default DormDetailPage;
