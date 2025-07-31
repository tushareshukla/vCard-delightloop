export default function TempLogo({ v2, mobile }: { v2?: boolean, mobile?: boolean }) {
  return (
    <div className="flex items-center space-x-2 ">
      <div className="relative">
        <div className={`size-8   rounded-full flex items-center justify-center ${v2 ? "bg-gradient-to-br from-white to-white/80" : "bg-gradient-to-br from-primary to-primary/80"}`}>
          <div className={`w-3 h-3 bg-white rounded-full ${v2 ? "bg-white" : "bg-primary"}`}></div>
        </div>
        <div className={`absolute -top-1 -right-1 size-3 rounded-full opacity-60 ${v2 ? "bg-white" : "bg-primary/40"}`}></div>
        <div className={`absolute -bottom-1 -left-1 size-2 rounded-full opacity-40 ${v2 ? "bg-white" : "bg-primary/30"}`}></div>
      </div>
      {
        !mobile && (
      <span className={`text-xl font-bold ${v2 ? "text-white" : "text-gray-900"} font-poppins`}>
        delight<span className={`${v2 ? "text-white/80" : "text-primary"}`}>o</span>
      </span>)
      }
    </div>
  );
}
