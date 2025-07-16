import { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Image from "next/image";

interface CircularProgressProps {
  totalCampaigns: number;
  completedCampaigns: number;
  liveCampaigns: number;
  draftCampaigns: number;
  waitingCampaigns: number;
}

const CircularProgress = ({
  totalCampaigns,
  completedCampaigns,
  liveCampaigns,
  draftCampaigns,
  waitingCampaigns,
}: CircularProgressProps) => {
  const [completedValue, setCompletedValue] = useState(0);
  const [liveValue, setLiveValue] = useState(0);
  const [draftValue, setDraftValue] = useState(0);
  const [countValue, setCountValue] = useState(0);
  const [waitingValue, setWaitingValue] = useState(0);
  const [animatedCompleted, setAnimatedCompleted] = useState(0);
  const [animatedLive, setAnimatedLive] = useState(0);
  const [animatedDraft, setAnimatedDraft] = useState(0);
  const [animatedWaiting, setAnimatedWaiting] = useState(0);

  useEffect(() => {
    const totalValues =
      completedCampaigns + liveCampaigns + draftCampaigns + waitingCampaigns;
    const completedPercentage = (completedCampaigns / totalValues) * 100;
    const livePercentage = (liveCampaigns / totalValues) * 100;
    const waitingPercentage = (waitingCampaigns / totalValues) * 100;
    // const draftPercentage = (draftCampaigns / totalValues) * 100;

    const duration = 2000;
    const interval = 16;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const easeOutCubic = (t: number) => {
        return 1 - Math.pow(1 - t, 4);
      };

      const easedProgress = easeOutCubic(progress);

      setCompletedValue(easedProgress * completedPercentage);
      setLiveValue(easedProgress * (completedPercentage + livePercentage));
      setWaitingValue(
        easedProgress * (completedPercentage + livePercentage + waitingPercentage)
      );
      setDraftValue(easedProgress * 100);
      setCountValue(Math.round(easedProgress * totalCampaigns));
      setAnimatedCompleted(Math.round(easedProgress * completedCampaigns));
      setAnimatedLive(Math.round(easedProgress * liveCampaigns));
      setAnimatedDraft(Math.round(easedProgress * draftCampaigns));
      setAnimatedWaiting(Math.round(easedProgress * waitingCampaigns));
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [
    totalCampaigns,
    completedCampaigns,
    liveCampaigns,
    draftCampaigns,
    waitingCampaigns,
  ]);

  return (
    <div className="   rounded-lg grid grid-cols-2    border-[1px] border-[#D2CEFE] h-[193px]  w-[391px] p-4 justify-center items-center">
      {/* //! main text */}
      <h2 className="col-span-2 text-[16px] font-[600] mb-3 pl-2 ">
        Campaign Status
      </h2>
      {/*  //! Circle */}
      <div className="relative w-[110px] h-[110px]">
        {/* Draft Circle */}
        <div
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <CircularProgressbar
            value={draftValue}
            strokeWidth={12}
            styles={buildStyles({
              pathColor: "#D2CEFE",
              trailColor: "transparent",
              strokeLinecap: "round",
              rotation: 0.75,
              pathTransition: "none",
            })}
          />
        </div>
        {/* waiting Circle */}
        <div
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <CircularProgressbar
            value={waitingValue}
            strokeWidth={12}
            styles={buildStyles({
              pathColor: "#EF6820",
              trailColor: "transparent",
              strokeLinecap: "round",
              rotation: 0.75,
              pathTransition: "none",
            })}
          />
        </div>



        {/* live Circle */}
        <div
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <CircularProgressbar
            value={liveValue}
            strokeWidth={12}
            styles={buildStyles({
              pathColor: "#6941C6",
              trailColor: "transparent",
              strokeLinecap: "round",
              rotation: 0.75,
              pathTransition: "none",
            })}
          />
        </div>
          {/* completed Circle */}
          <div
          className="absolute inset-0"
          style={{ transform: "rotate(-90deg)" }}
        >
          <CircularProgressbar
            value={completedValue}
            strokeWidth={12}
            styles={buildStyles({
              pathColor: "#43D774",
              trailColor: "transparent",
              strokeLinecap: "round",
              rotation: 0.75,
              pathTransition: "none",
            })}
          />
        </div>


        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full w-[70%] h-[70%] flex flex-col items-center justify-center shadow-sm">
            <p className="text-[25px] font-[800]">{countValue}</p>
            <p className="text-[12px] font-[800] text-black">TOTAL</p>
          </div>
        </div>
      </div>
      {/* //!  text */}
      <div className=" ">
        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-green-500"></div>
          <p className="text-lg font-semibold">{animatedCompleted}</p>
          <p className="text-[#101828] font-medium">Completed</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[#6941C6]"></div>
          <p className="text-lg font-semibold">{animatedLive}</p>
          <p className="text-[#101828] font-medium">Live</p>
        </div>

        {/* Apply negative margin to shift this entire row left */}
        <div className="flex items-center gap-2 ">
          <div className="size-2.5 rounded-full bg-[#EF6820]"></div>
          <p className="text-lg font-semibold">{animatedWaiting}</p>
          <p className="text-[#101828] font-medium ">Waiting for Approval</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="size-2.5 rounded-full bg-[#D2CEFE]"></div>
          <p className="text-lg font-semibold">{animatedDraft}</p>
          <p className="text-[#101828] font-medium">Draft</p>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;
