import { redirect } from "next/navigation";

export default function Activate() {
  redirect("/login?activatepath=true");
  return <div>Activate</div>;
}
