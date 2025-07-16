import { useState, useEffect } from "react";

interface RangeSliderProps {
  setBudget: (min: number, max: number) => void;
  initialMin?: number;
  initialMax?: number;
  notMoney?: boolean;
}

const RangeSlider = ({
  setBudget,
  notMoney,
  initialMin = 0,
  initialMax = 50,
}: RangeSliderProps) => {
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);

  useEffect(() => {
    console.log("Budget values updating:", { min: minValue, max: maxValue });
    setBudget(minValue, maxValue);
  }, [minValue, maxValue, setBudget]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxValue - 1);
    setMinValue(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minValue + 1);
    setMaxValue(value);
  };

  return (
    <div className="w-full ">
      <div className="relative h-6">
        {/* Background track */}
        <div className="absolute w-full h-[8px] bg-[#E9D7FE] rounded-[4px] top-1/2 -translate-y-1/2 border border-[#D2CEFE]" />

        {/* Active track */}
        <div
          className="absolute h-[8px] bg-primary rounded-[4px] top-1/2 -translate-y-1/2"
          style={{
            left: `${(minValue / 500) * 100}%`,
            width: `${(maxValue - minValue) / 500 * 100}%`,
          }}
        />

        {/* Min value tooltip */}
        {/* <div
          className="absolute top-0 transform -translate-y-full -translate-x-1/2"
          style={{ left: `${minValue}%` }}
        >
          <div className="relative mb-2">
            <div className="bg-white shadow-sm rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap">
              ${minValue}
            </div>
            <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white transform rotate-45 -translate-x-1/2" />
          </div>
        </div> */}

        {/* Max value tooltip */}
        <div
          className="absolute top-0 transform -translate-y-full -translate-x-1/2"
          style={{ left: `${(maxValue / 500) * 100}%` }}
        >
          <div className="relative mb-2">
            <div className="bg-white shadow-sm rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap">
              {notMoney ? maxValue : `$${maxValue}`}
            </div>
            <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-white transform rotate-45 -translate-x-1/2" />
          </div>
        </div>

        {/* Minimum value thumb */}
        {/* <input
          type="range"
          min="1"
          max="100"
          value={minValue}
          onChange={handleMinChange}
          className="absolute w-full h-1 bg-transparent appearance-none z-20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-[1px]
            [&::-webkit-slider-thumb]:-mb-[18px]
            [&::-webkit-slider-thumb]:border-solid
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-[1px]
            [&::-moz-range-thumb]:border-solid
            [&::-moz-range-thumb]:-mb-[18px]
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:shadow-sm"
        /> */}

        {/* Maximum value thumb */}
        <input
          type="range"
          min="1"
          max="500"
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute w-full h-1 bg-transparent appearance-none z-20
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-[1px]
            [&::-webkit-slider-thumb]:-mb-[18px]
            [&::-webkit-slider-thumb]:border-solid
            [&::-webkit-slider-thumb]:border-primary
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-[1px]
            [&::-moz-range-thumb]:border-solid
            [&::-moz-range-thumb]:-mb-[18px]
            [&::-moz-range-thumb]:border-primary
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:shadow-sm"
        />
      </div>
    </div>
  );
};

export default RangeSlider;
