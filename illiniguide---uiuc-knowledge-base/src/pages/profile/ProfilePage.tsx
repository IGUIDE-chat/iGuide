import React from 'react';
import { ProfileScreen } from '../../components/ProfileScreen';
import { Language } from '../../types';

interface ProfilePageProps {
  language: Language;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ language }) => {
  return <ProfileScreen language={language} onBack={() => window.history.back()} />;
};

export default ProfilePage;
