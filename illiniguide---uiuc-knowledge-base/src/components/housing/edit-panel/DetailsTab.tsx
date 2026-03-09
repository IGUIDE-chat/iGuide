import React from 'react';
import { BathroomType, DiningType, Dorm } from '../../../types/housing';
import {
  BATHROOM_TYPE_OPTIONS,
  DINING_OPTIONS,
  getLocalizedLabel,
  HOUSING_TYPE_OPTIONS,
} from '../../../constants/housing/metadata';
import { DormEditFormState } from './useDormEditForm';
import { Field, Toggle, inputCls } from './EditPanelFields';

interface DetailsTabProps {
  form: DormEditFormState;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({ form }) => {
  const { t } = form;

  return (
    <>
      <Field label={t.labels.housingType}>
        <select
          value={form.housingType}
          onChange={(event) => form.setHousingType(event.target.value as Dorm['housingType'])}
          className={inputCls}
        >
          {HOUSING_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.shortLabel}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t.labels.annualPrice}>
        <input
          type="number"
          min={0}
          value={form.price}
          onChange={(event) => form.setPrice(event.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label={t.labels.applicationFee}>
        <input
          type="number"
          min={0}
          value={form.applicationFee}
          onChange={(event) => form.setApplicationFee(event.target.value)}
          className={inputCls}
          placeholder={t.hints.feePlaceholder}
        />
      </Field>
      <Toggle label={t.labels.airConditioning} checked={form.ac} onChange={form.setAc} />
      <Field label={t.labels.dining}>
        <select
          value={form.dining}
          onChange={(event) => form.setDining(event.target.value as DiningType)}
          className={inputCls}
        >
          {DINING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {getLocalizedLabel(option, form.language)}
            </option>
          ))}
        </select>
      </Field>
      {form.dining === 'nearby' && (
        <Field label={t.labels.dining}>
          <input
            type="text"
            value={form.diningNearbyDetail}
            onChange={(event) => form.setDiningNearbyDetail(event.target.value)}
            className={inputCls}
            placeholder={t.hints.nearbyDining}
          />
        </Field>
      )}
      <Field label={t.labels.bathroomType}>
        <select
          value={form.bathroomType}
          onChange={(event) => form.setBathroomType(event.target.value as BathroomType)}
          className={inputCls}
        >
          {BATHROOM_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {getLocalizedLabel(option, form.language)}
            </option>
          ))}
        </select>
      </Field>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-500 mb-1.5">{t.labels.roomOptions}</p>
        <p className="text-[11px] text-gray-400 mb-2">{t.hints.roomOptions}</p>
        <div className="flex flex-wrap gap-1.5">
          {form.derivedRoomOptions.length > 0 ? (
            form.derivedRoomOptions.map((option) => (
              <span
                key={`${option.labelCode ?? 'custom'}-${option.bedCount ?? 'na'}-${option.bathroomCount ?? 'na'}-${option.bathroomScope}`}
                className="inline-block px-2 py-0.5 rounded-md border border-gray-300 text-gray-600 text-xs bg-white"
              >
                {form.getRoomDisplayLabel(option, form.language)}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">{t.values.noFloorPlans}</span>
          )}
        </div>
      </div>
    </>
  );
};
