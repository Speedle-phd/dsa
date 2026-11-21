import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

type AuthMode = 'login' | 'signup'

type FormValues = {
   username: string
   email: string
   password: string
}

export function AuthPage() {
   const [mode, setMode] = useState<AuthMode>('login')
   const [showPassword, setShowPassword] = useState(false)
   const language = useLanguageStore((state) => state.language)
   const { login, register: registerUser } = useAuth()
   const navigate = useNavigate()
   const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
   } = useForm<FormValues>({
      defaultValues: { username: '', email: '', password: '' },
   })

   const isSignup = mode === 'signup'

   async function onSubmit(values: FormValues) {
      try {
         const message = isSignup
            ? await registerUser(values.username, values.email, values.password)
            : await login(values.email, values.password)
         toast.success(t(message, language))
         navigate('/dashboard', { replace: true })
      } catch (error) {
         toast.error(
            error instanceof Error
               ? error.message
               : t('Unable to authenticate', language),
         )
      }
   }

   return (
      <main className='auth-shell' lang={language}>
         <section
            className='auth-intro'
            aria-label={t('DSA5 Hero Sheet', language)}
         >
            <div className='brand-mark'>
               <Sparkles aria-hidden='true' size={24} />
            </div>
            <p className='eyebrow'>{t('Das Schwarze Auge 5', language)}</p>
            <h1>{t('Every hero has a story.', language)}</h1>
            <p className='intro-copy'>
               {t(
                  'Keep your character, choices, and next adventure close at hand.',
                  language,
               )}
            </p>
            <div className='intro-rule' />
            <p className='intro-caption'>
               {t('Your table. Your tales. Your sheet.', language)}
            </p>
         </section>

         <section className='auth-panel' aria-labelledby='auth-heading'>
            <div className='auth-card'>
               <div className='auth-card-heading'>
                  <ShieldCheck aria-hidden='true' size={22} />
                  <div>
                     <p className='eyebrow'>
                        {t('Hero registry', language)}
                     </p>
                     <h2 id='auth-heading'>
                        {t(
                           isSignup ? 'Create your account' : 'Welcome back',
                           language,
                        )}
                     </h2>
                  </div>
                  <LanguageToggle />
                  <ThemeToggle />
               </div>

               <div
                  className='auth-tabs'
                  role='tablist'
                  aria-label={t('Authentication options', language)}
               >
                  <button
                     className={!isSignup ? 'auth-tab is-active' : 'auth-tab'}
                     type='button'
                     onClick={() => setMode('login')}
                  >
                     {t('Sign in', language)}
                  </button>
                  <button
                     className={isSignup ? 'auth-tab is-active' : 'auth-tab'}
                     type='button'
                     onClick={() => setMode('signup')}
                  >
                     {t('Create account', language)}
                  </button>
               </div>

               <form
                  className='auth-form'
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
               >
                  {isSignup && (
                     <label className='field-group'>
                        <span>{t('Hero name', language)}</span>
                        <input
                           autoComplete='username'
                           {...register('username', {
                              required: 'Hero name is required',
                              minLength: {
                                 value: 3,
                                 message: 'Use at least 3 characters',
                              },
                              maxLength: {
                                 value: 30,
                                 message: 'Use 30 characters or fewer',
                              },
                           })}
                        />
                        {errors.username && (
                           <small className='field-error'>
                              {t(errors.username.message ?? '', language)}
                           </small>
                        )}
                     </label>
                  )}
                  <label className='field-group'>
                     <span>{t('Email address', language)}</span>
                     <input
                        type='email'
                        autoComplete='email'
                        {...register('email', {
                           required: 'Email is required',
                           pattern: {
                              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                              message: 'Enter a valid email address',
                           },
                        })}
                     />
                     {errors.email && (
                        <small className='field-error'>
                           {t(errors.email.message ?? '', language)}
                        </small>
                     )}
                  </label>
                  <label className='field-group'>
                     <span>{t('Password', language)}</span>
                     <span className='password-input'>
                        <input
                           type={showPassword ? 'text' : 'password'}
                           autoComplete={
                              isSignup ? 'new-password' : 'current-password'
                           }
                           {...register('password', {
                              required: 'Password is required',
                              minLength: isSignup
                                 ? {
                                      value: 8,
                                      message: 'Use at least 8 characters',
                                   }
                                 : undefined,
                              pattern: isSignup
                                 ? {
                                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
                                      message:
                                         'Include upper/lowercase, number, and symbol',
                                   }
                                 : undefined,
                           })}
                        />
                        <button
                           className='icon-button'
                           type='button'
                           onClick={() =>
                              setShowPassword((visible) => !visible)
                           }
                           aria-label={
                              t(
                                 showPassword
                                    ? 'Hide password'
                                    : 'Show password',
                                 language,
                              )
                           }
                        >
                           {showPassword ? (
                              <EyeOff size={18} />
                           ) : (
                              <Eye size={18} />
                           )}
                        </button>
                     </span>
                     {errors.password && (
                        <small className='field-error'>
                           {t(errors.password.message ?? '', language)}
                        </small>
                     )}
                  </label>
                  <button
                     className='primary-button'
                     type='submit'
                     disabled={isSubmitting}
                  >
                     {isSubmitting
                        ? t('Working...', language)
                        : t(
                             isSignup
                                ? 'Begin your chronicle'
                                : 'Enter your sheet',
                             language,
                          )}
                  </button>
               </form>
            </div>
         </section>
      </main>
   )
}
