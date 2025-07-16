import Radio from "@/components/common/Radio";

type ProgressbarProps = {
  block: {
    giftStrategyVisible: boolean;
    giftVisible: boolean;
  };
};
export default function Progressbar({ block }: ProgressbarProps) {
  return (
    <div className={` grid-flow-col gap-1 w-fit   flex mx-auto   `}>
      <Radio
        mainText="Campaign details"
        partnerIntegration={true}
        status={
          block.giftVisible
            ? "completed"
            : block.giftStrategyVisible
            ? "active"
            : "inactive"
        }
        showLine={false}
      />
      <Radio
        mainText="Setting Target Goals"
        partnerIntegration={true}
        status={
          block.giftStrategyVisible && block.giftVisible
            ? "active"
            : block.giftStrategyVisible
            ? "inactive"
            : "completed"
        }
        showLine={false}
      />
      <Radio
        mainText="Setting Up Budget"
        status={
          block.giftStrategyVisible
            ? "inactive"
            : block.giftStrategyVisible
            ? "active"
            : "completed"
        }
        showLine={true}
      />
    </div>
  );
}
