import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { type Resolver, useForm } from 'react-hook-form'
import { useModalKeyboard } from '../../components/useModalKeyboard'
import type { Hero, HeroInput } from './heroApi'
import { heroFormSchema, type HeroFormValues } from './heroSchema'
import { t } from '@/locales/translation'
import { useLanguageStore } from '@/locales/languageStore'

type HeroEditorProps = {
   hero: Hero | null
   isSaving: boolean
   onClose: () => void
   onSave: (hero: HeroInput) => void
}

const emptyHero: HeroFormValues = {
   name: '',
   title: '',
   sex: 'other',
   age: 18,
   species: 'Human',
   placeOfOrigin: '',
   culture: '',
   profession: '',
   socialStatus: '',
   height: '',
   weight: '',
   build: '',
   eyeColor: '',
   hairColor: '',
   appearance: '',
   background: '',
   biography: '',
   parents: '',
   siblings: '',
   partner: '',
   children: '',
   familyNotes: '',
   status: 'active',
}

function toFormValues(hero: Hero | null): HeroFormValues {
   if (!hero) return emptyHero
   return {
      ...hero,
      height: hero.height?.toString() ?? '',
      weight: hero.weight?.toString() ?? '',
      parents: hero.familyTree?.parents?.join(', ') ?? '',
      siblings: hero.familyTree?.siblings?.join(', ') ?? '',
      partner: hero.familyTree?.partner ?? '',
      children: hero.familyTree?.children?.join(', ') ?? '',
      familyNotes: hero.familyTree?.notes ?? '',
   }
}

function toOptionalNumber(value: string) {
   return value === '' ? undefined : Number(value)
}

function toNames(value: string) {
   return value
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
}

export function HeroEditor({
   hero,
   isSaving,
   onClose,
   onSave,
}: HeroEditorProps) {
   const dialogRef = useModalKeyboard(onClose)
   const language = useLanguageStore((state) => state.language)
   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<HeroFormValues>({
      resolver: zodResolver(heroFormSchema(language)) as Resolver<HeroFormValues>,
      defaultValues: toFormValues(hero),
   })

   function submit(values: HeroFormValues) {
      const { parents, siblings, partner, children, familyNotes, ...hero } =
         values
      onSave({
         ...hero,
         height: toOptionalNumber(values.height),
         weight: toOptionalNumber(values.weight),
         familyTree: {
            parents: toNames(parents),
            siblings: toNames(siblings),
            partner: partner || null,
            children: toNames(children),
            notes: familyNotes,
         },
      })
   }

   return (
      <div className='modal-backdrop' role='presentation' onMouseDown={onClose}>
         <section
            ref={dialogRef}
            className='hero-editor'
            role='dialog'
            aria-modal='true'
            aria-labelledby='hero-editor-title'
            onMouseDown={(event) => event.stopPropagation()}
         >
            <header className='editor-header'>
               <div>
                  <p className='eyebrow'>{t('Hero registry', language)}</p>
                  <h2 id='hero-editor-title'>
                           {t(hero ? 'Edit hero' : 'Add a hero', language)}
                  </h2>
               </div>
               <button
                  className='icon-button editor-close'
                  type='button'
                  onClick={onClose}
                  aria-label={t('Close editor', language)}
               >
                  <X size={20} />
               </button>
            </header>
            <form
               className='hero-form'
               onSubmit={handleSubmit(submit)}
               noValidate
            >
               <fieldset className='form-section'>
                  <legend>{t('Identity', language)}</legend>
                  <div className='form-grid'>
                     <label className='field-group field-wide'>
                        <span>{t('Name', language)}</span>
                        <input autoFocus {...register('name')} />
                        {errors.name && (
                           <small className='field-error'>
                              {errors.name.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Title', language)}</span>
                        <input {...register('title')} />
                     </label>
                     <label className='field-group'>
                        <span>{t('Status', language)}</span>
                        <select {...register('status')}>
                           <option value='active'>{t('Active', language)}</option>
                           <option value='retired'>{t('Retired', language)}</option>
                           <option value='deceased'>{t('Deceased', language)}</option>
                        </select>
                     </label>
                     <label className='field-group'>
                        <span>{t('Sex', language)}</span>
                        <select {...register('sex')}>
                           <option value='female'>{t('Female', language)}</option>
                           <option value='male'>{t('Male', language)}</option>
                           <option value='other'>{t('Other', language)}</option>
                        </select>
                     </label>
                     <label className='field-group'>
                        <span>{t('Age', language)}</span>
                        <input
                           type='number'
                           min='1'
                           max='200'
                           {...register('age', {
                              valueAsNumber: true,
                           })}
                        />
                        {errors.age && (
                           <small className='field-error'>
                              {errors.age.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Species', language)}</span>
                        <input {...register('species')} />
                        {errors.species && (
                           <small className='field-error'>
                              {errors.species.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Place of origin', language)}</span>
                        <input {...register('placeOfOrigin')} />
                        {errors.placeOfOrigin && (
                           <small className='field-error'>
                              {errors.placeOfOrigin.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Culture', language)}</span>
                        <input {...register('culture')} />
                        {errors.culture && (
                           <small className='field-error'>
                              {errors.culture.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Profession', language)}</span>
                        <input {...register('profession')} />
                        {errors.profession && (
                           <small className='field-error'>
                              {errors.profession.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Social status', language)}</span>
                        <input {...register('socialStatus')} />
                        {errors.socialStatus && (
                           <small className='field-error'>
                              {errors.socialStatus.message}
                           </small>
                        )}
                     </label>
                  </div>
               </fieldset>
               <fieldset className='form-section'>
                  <legend>{t('Family', language)}</legend>
                  <div className='form-grid'>
                     <label className='field-group field-wide'>
                        <span>{t('Parents', language)}</span>
                        <input
                           placeholder={t('Names, separated by commas', language)}
                           {...register('parents')}
                        />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Siblings', language)}</span>
                        <input
                           placeholder={t('Names, separated by commas', language)}
                           {...register('siblings')}
                        />
                     </label>
                     <label className='field-group'>
                        <span>{t('Partner', language)}</span>
                        <input {...register('partner')} />
                     </label>
                     <label className='field-group'>
                        <span>{t('Children', language)}</span>
                        <input
                           placeholder={t('Names, separated by commas', language)}
                           {...register('children')}
                        />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Family notes', language)}</span>
                        <textarea rows={3} {...register('familyNotes')} />
                        {errors.familyNotes && (
                           <small className='field-error'>
                              {errors.familyNotes.message}
                           </small>
                        )}
                     </label>
                  </div>
               </fieldset>
               <fieldset className='form-section'>
                  <legend>{t('Appearance', language)}</legend>
                  <div className='form-grid'>
                     <label className='field-group'>
                        <span>{t('Height (cm)', language)}</span>
                        <input
                           type='number'
                           min='0'
                           step='0.1'
                           {...register('height')}
                        />
                        {errors.height && (
                           <small className='field-error'>
                              {errors.height.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Weight (kg)', language)}</span>
                        <input
                           type='number'
                           min='0'
                           step='0.1'
                           {...register('weight')}
                        />
                        {errors.weight && (
                           <small className='field-error'>
                              {errors.weight.message}
                           </small>
                        )}
                     </label>
                     <label className='field-group'>
                        <span>{t('Build', language)}</span>
                        <input {...register('build')} />
                     </label>
                     <label className='field-group'>
                        <span>{t('Eye color', language)}</span>
                        <input {...register('eyeColor')} />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Hair color', language)}</span>
                        <input {...register('hairColor')} />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Appearance & characteristics', language)}</span>
                        <textarea rows={3} {...register('appearance')} />
                        {errors.appearance && (
                           <small className='field-error'>
                              {errors.appearance.message}
                           </small>
                        )}
                     </label>
                  </div>
               </fieldset>
               <fieldset className='form-section'>
                  <legend>{t('Chronicle', language)}</legend>
                  <div className='form-grid'>
                     <label className='field-group field-wide'>
                        <span>{t('Background', language)}</span>
                        <textarea rows={3} {...register('background')} />
                     </label>
                     <label className='field-group field-wide'>
                        <span>{t('Biography', language)}</span>
                        <textarea rows={4} {...register('biography')} />
                     </label>
                  </div>
               </fieldset>
               <footer className='editor-actions'>
                  <button
                     className='quiet-button'
                     type='button'
                     onClick={onClose}
                  >
                     {t('Cancel', language)}
                  </button>
                  <button
                     className='primary-button'
                     type='submit'
                     disabled={isSaving}
                  >
                     {isSaving
                        ? t('Saving...', language)
                        : hero
                          ? t('Save changes', language)
                          : t('Create hero', language)}
                  </button>
               </footer>
            </form>
         </section>
      </div>
   )
}
