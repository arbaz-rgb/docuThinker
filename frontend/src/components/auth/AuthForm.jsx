const AuthForm = ({
  error,
  fields,
  footer,
  isSubmitting,
  onChange,
  onSubmit,
  submitLabel,
  values,
}) => {
  return (
    <>
      {error ? <div className="form-alert">{error}</div> : null}

      <form className="form-stack" onSubmit={onSubmit}>
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            <input
              autoComplete={field.autoComplete}
              minLength={field.minLength}
              name={field.name}
              onChange={onChange}
              placeholder={field.placeholder}
              required
              type={field.type}
              value={values[field.name]}
            />
          </label>
        ))}

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Please wait..." : submitLabel}
        </button>
      </form>

      {footer}
    </>
  );
};

export default AuthForm;
