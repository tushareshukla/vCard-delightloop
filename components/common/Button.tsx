import Image from "next/image";
interface ButtonProps {
  text: string;
  icon: string;
  value: string;
  name: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
export default function Button({ text, icon, value, name, onChange, disabled, checked }: ButtonProps) {
  return (
    <label
      id={`${text}`}
      className="font-medium group cursor-pointer hover:bg-slate-50 duration-300 has-[:checked]:bg-primary has-[:checked]:text-white px-3 py-2 rounded-lg shadow-sm w-fit flex items-center gap-2 bg-white"
    >
      <input
        type="radio"
        name={`${name}`}
        checked={checked}
        value={`${value}`}
        className="hidden"
        onChange={onChange || (() => {})}
        disabled={disabled}
      />
      {/* Image container */}
      <div className="bg-gradient-to-r group-has-[:checked]:hidden   from-[#4A25E1] to-[#7B5AFF] rounded-full w-fit shadow-lg p-1 outline-4 outline outline-white ">
        <Image
          src={`svgs/${icon}.svg`}
          alt="arrow right"
          width={18}
          height={18}
        />
      </div>
      <div className="group-has-[:checked]:block shadow-sm hidden   p-1 bg-gradient-to-r from-[#E3CEFE] to-[#FCFCFD] rounded-full w-fit ">
        <Image
          src={`svgs/Tick2.svg`}
          alt="arrow right"
          width={18}
          height={18}
        />
      </div>
      {text}
    </label>
  );
}
