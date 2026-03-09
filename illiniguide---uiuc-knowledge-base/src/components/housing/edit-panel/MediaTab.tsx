import React from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { BathroomScope, FloorPlan } from '../../../types/housing';
import { normalizeFloorPlan } from '../../../utils/roomOptions';
import { EditableList, Field, Toggle, inputCls } from './EditPanelFields';
import {
  createFloorPlan,
  DormEditFormState,
  getLayoutKind,
} from './useDormEditForm';

interface MediaTabProps {
  form: DormEditFormState;
}

export const MediaTab: React.FC<MediaTabProps> = ({ form }) => {
  const { t } = form;

  return (
    <>
      <Field label={t.labels.imageUrl}>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.imageUrl || ''}
            onChange={(event) => form.setImageUrl(event.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
          <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 cursor-pointer transition-colors text-gray-700">
            {form.uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="text-xs font-medium">{t.actions.upload}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  void form.uploadImage(event.target.files[0], form.setImageUrl);
                }
                event.target.value = '';
              }}
            />
          </label>
        </div>
      </Field>
      <Field label={t.labels.galleryImages}>
        <EditableList
          items={form.galleryImages}
          onChange={form.setGalleryImages}
          placeholder={t.actions.addGalleryImage}
        />
      </Field>
      <Field label={t.labels.floorPlans}>
        <div className="space-y-3">
          {form.normalizedFloorPlans.map((plan, index) => {
            const layoutKind = getLayoutKind(plan);
            const scope = plan.bathroomScope ?? form.bathroomType;
            const preview = form.getRoomDisplayLabel(
              {
                bedCount: plan.bedCount ?? null,
                bathroomCount: plan.bathroomCount ?? null,
                bathroomScope: scope,
                labelCode: plan.labelCode,
              },
              form.language,
            );
            const update = (patch: Partial<FloorPlan>, renormalize = true) =>
              form.updateFloorPlan(index, (current) =>
                renormalize
                  ? normalizeFloorPlan({ ...current, ...patch }, form.bathroomType)
                  : ({ ...current, ...patch } as FloorPlan),
              );

            return (
              <div key={index} className="flex flex-col gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-gray-500">
                      {t.labels.floorPlans} #{index + 1}
                    </span>
                    <div className="text-xs text-gray-400 mt-1">{preview}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      form.setFloorPlans((current) =>
                        current.filter((_, currentIndex) => currentIndex !== index),
                      )
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t.labels.layoutKind}>
                    <select
                      value={layoutKind}
                      onChange={(event) =>
                        update(
                          {
                            type:
                              event.target.value === 'standard'
                                ? undefined
                                : (event.target.value as FloorPlan['type']),
                            labelCode:
                              event.target.value === 'standard'
                                ? undefined
                                : event.target.value,
                          },
                          true,
                        )
                      }
                      className={inputCls}
                    >
                      <option value="standard">{t.values.standard}</option>
                      <option value="Studio">{t.values.studio}</option>
                      <option value="Suite">{t.values.suite}</option>
                      <option value="Cluster">{t.values.cluster}</option>
                    </select>
                  </Field>
                  <Field label={t.labels.bathroomType}>
                    <select
                      value={scope}
                      onChange={(event) =>
                        update(
                          {
                            bathroomScope: event.target.value as BathroomScope,
                            bathroomCount:
                              event.target.value === 'communal'
                                ? 0
                                : plan.bathroomCount ?? null,
                          },
                          true,
                        )
                      }
                      className={inputCls}
                    >
                      <option value="communal">{t.values.communal}</option>
                      <option value="semi-private">{t.values.semiPrivate}</option>
                      <option value="private">{t.values.private}</option>
                    </select>
                  </Field>
                  {layoutKind === 'standard' && (
                    <Field label={t.labels.bedCount}>
                      <select
                        value={plan.bedCount ?? 1}
                        onChange={(event) =>
                          update(
                            {
                              bedCount: Number(event.target.value),
                              type: undefined,
                              labelCode: undefined,
                            },
                            true,
                          )
                        }
                        className={inputCls}
                      >
                        {[1, 2, 3, 4, 5].map((count) => (
                          <option key={count} value={count}>
                            {count}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label={t.labels.bathroomCount}>
                    <input
                      type="number"
                      min={0}
                      value={scope === 'communal' ? 0 : plan.bathroomCount ?? ''}
                      onChange={(event) =>
                        update(
                          {
                            bathroomCount:
                              event.target.value === '' ? null : Number(event.target.value),
                          },
                          true,
                        )
                      }
                      className={inputCls}
                      disabled={scope === 'communal'}
                    />
                  </Field>
                  <Field label={t.labels.pricePerYear}>
                    <input
                      type="number"
                      min={0}
                      value={plan.price}
                      onChange={(event) => update({ price: Number(event.target.value) }, false)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t.labels.sqft}>
                    <input
                      type="number"
                      min={0}
                      value={plan.sqft ?? ''}
                      onChange={(event) =>
                        update(
                          {
                            sqft:
                              event.target.value === ''
                                ? undefined
                                : Number(event.target.value),
                          },
                          false,
                        )
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label={t.labels.shortDescription}>
                  <input
                    type="text"
                    value={plan.description ?? ''}
                    onChange={(event) => update({ description: event.target.value }, false)}
                    className={inputCls}
                  />
                </Field>
                <Field label={t.labels.planImageUrl}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={plan.imageUrl ?? ''}
                      onChange={(event) => update({ imageUrl: event.target.value }, false)}
                      className={inputCls}
                      placeholder="https://..."
                    />
                    <label className="flex-shrink-0 flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-3 cursor-pointer transition-colors text-gray-700">
                      <Upload size={14} />
                      <span className="text-xs font-medium">{t.actions.upload}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.[0]) {
                            void form.uploadImage(event.target.files[0], (url) =>
                              update({ imageUrl: url }, false),
                            );
                          }
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </Field>
                <Toggle
                  label={t.labels.available}
                  checked={plan.available !== false}
                  onChange={(value) => update({ available: value }, false)}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => form.setFloorPlans((current) => [...current, createFloorPlan()])}
            className="flex items-center gap-1 text-xs text-illini-blue hover:underline"
          >
            <Plus size={12} /> {t.actions.addFloorPlan}
          </button>
        </div>
      </Field>
    </>
  );
};
