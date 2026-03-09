import React from 'react';
import { FileText, Image, Info, Tag } from 'lucide-react';
import { Dorm } from '../../types/housing';
import { Language } from '../../types';
import { ContentTab } from './edit-panel/ContentTab';
import { DetailsTab } from './edit-panel/DetailsTab';
import { DormEditPanelShell } from './edit-panel/DormEditPanelShell';
import { MediaTab } from './edit-panel/MediaTab';
import { TagsTab } from './edit-panel/TagsTab';
import { ActiveTab, useDormEditForm } from './edit-panel/useDormEditForm';

interface DormEditPanelProps {
  dorm: Dorm;
  language: Language;
  onClose: () => void;
  onSaved: (updated: Dorm) => void;
}

const DormEditPanel: React.FC<DormEditPanelProps> = ({
  dorm,
  language,
  onClose,
  onSaved,
}) => {
  const form = useDormEditForm({
    dorm,
    language,
    onClose,
    onSaved,
  });

  const tabs: { id: ActiveTab; icon: React.ReactNode; label: string }[] = [
    { id: 'content', icon: <FileText size={14} />, label: form.t.tabs.content },
    { id: 'details', icon: <Info size={14} />, label: form.t.tabs.details },
    { id: 'tags', icon: <Tag size={14} />, label: form.t.tabs.tags },
    { id: 'media', icon: <Image size={14} />, label: form.t.tabs.media },
  ];

  return (
    <DormEditPanelShell
      title={language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name}
      activeTab={form.activeTab}
      tabs={tabs}
      saving={form.saving}
      saveSuccess={form.saveSuccess}
      saveError={form.saveError}
      saveLabel={form.t.actions.save}
      savingLabel={form.t.actions.saving}
      savedLabel={form.t.actions.saved}
      cancelLabel={form.t.actions.cancel}
      onClose={onClose}
      onSave={form.save}
      onTabChange={form.setActiveTab}
    >
      {form.activeTab === 'content' && <ContentTab form={form} />}
      {form.activeTab === 'details' && <DetailsTab form={form} />}
      {form.activeTab === 'tags' && <TagsTab form={form} />}
      {form.activeTab === 'media' && <MediaTab form={form} />}
    </DormEditPanelShell>
  );
};

export default DormEditPanel;
