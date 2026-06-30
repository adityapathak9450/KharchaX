export function FloatingField({
  id,
  label,
  type = 'text',
  autoComplete,
  error,
  register,
  rightSlot,
  ...inputProps
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder=" "
        className={`peer w-full rounded-xl input-field px-4 pb-2.5 pt-6 text-sm placeholder:text-transparent ${rightSlot ? 'pr-12' : ''}`}
        {...register}
        {...inputProps}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 origin-left text-xs text-muted transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:-translate-y-0 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
      {rightSlot ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div> : null}
      {error ? <p className="mt-1.5 text-xs text-rose-400">{error}</p> : null}
    </div>
  )
}
