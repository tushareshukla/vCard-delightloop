export default function Budget({ budget, setBudget }: { budget: number, setBudget: (budget: number) => void }) {
    return (
      <>
        <div className="flex items-center bg-white px-2 w-fit font-medium py- border-[#D2CEFE]  border rounded-lg">
          <span className="text-gray-700">$</span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            step="100"
            className=" bg-transparent outline-none w-20 px-1  [appearance:textfield]  [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="flex flex-col ">
            <button
              onClick={() => setBudget(budget + 500)}
              className="px-1 hover:bg-gray-100 "
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="rotate-90 mt-[6px]" viewBox="0 0 24 24"><path fill="currentColor" d="m3.55 12l7.35 7.35q.375.375.363.875t-.388.875t-.875.375t-.875-.375l-7.7-7.675q-.3-.3-.45-.675T.825 12t.15-.75t.45-.675l7.7-7.7q.375-.375.888-.363t.887.388t.375.875t-.375.875z"/></svg>
            </button>
            <button
              onClick={() => setBudget(budget - 500)}
              className="px-1 hover:bg-gray-100 -mt-2"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="-rotate-90 mb-[6px]" viewBox="0 0 24 24"><path fill="currentColor" d="m3.55 12l7.35 7.35q.375.375.363.875t-.388.875t-.875.375t-.875-.375l-7.7-7.675q-.3-.3-.45-.675T.825 12t.15-.75t.45-.675l7.7-7.7q.375-.375.888-.363t.887.388t.375.875t-.375.875z"/></svg>
            </button>
          </div>
        </div>
      </>
    );
  }
