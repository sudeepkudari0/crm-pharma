export const FormError = ({ message }: { message: string | undefined }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md text-sm text-destructive">
      <p>{message}</p>
    </div>
  );
};
