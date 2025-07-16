interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: () => void;
}

export default function Checkbox({ checked, onChange, id }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer relative w-fit">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="peer h-4 w-4 cursor-pointer transition-all appearance-none rounded shadow hover:shadow-md border border-[#7F56D9] checked:bg-[#F9F5FF] checked:border-[#7F56D9]"
      />
      <span className={`absolute text-[#7F56D9] opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 `}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </label>
  );
}
