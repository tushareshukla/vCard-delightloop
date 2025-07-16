export default function EnvCheck() {
  return (
    <div>
      <div>
      <p>NODE_ENV: {process.env.NODE_ENV}</p>
      <p>NEXT_PUBLIC_ENV: {process.env.NEXT_PUBLIC_ENV}</p>
      <p>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL}</p>
      <p>NEXT_PUBLIC_DOMAIN: {process.env.NEXT_PUBLIC_DOMAIN}</p>
    </div>
    </div>
  );
}
