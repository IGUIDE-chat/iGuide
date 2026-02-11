import React from 'react';
import DormList from '../../components/housing/DormList';
import AIChat from '../../components/housing/AIChat';
import { Language } from '../../types';

interface DormListPageProps {
  language: Language;
}

const DormListPage: React.FC<DormListPageProps> = ({ language }) => {
  return (
    <>
      <DormList language={language} />
      <AIChat language={language} />
    </>
  );
};

export default DormListPage;
