import Image from "next/image";
import { useState, useEffect } from "react";
import Card from "@/components/partner-integrations/Card";
import { toast } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

type SelectGiftStrategyProps = {
  block: {
    giftStrategyVisible: boolean;
    giftVisible: boolean;
  };
  setBlock: (block: {
    giftStrategyVisible: boolean;
    giftVisible: boolean;
  }) => void;
  setPlaybookId: (playbookId: string) => void;
};

export default function SelectGiftStrategy({
  block,
  setBlock,
  setPlaybookId,
}: SelectGiftStrategyProps) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth();
  const [selectedCard, setSelectedCard] = useState({
    card1: false,
    card2: false,
    card3: false,
  });

  const createPlaybook = async (selectedStrategy: string) => {
    try {
      if (!userId) {
        toast.error("Please login to create a playbook");
        return;
      }

      // Fetch user details to get organization_id
      const userResponse = await fetch(`/api/users/${userId}`);
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user details");
      }
      const userDetails = await userResponse.json();
      const userOrgId = userDetails.data.organization_id;

      // Get card-specific values
      let budget = 0;
      let deliveryType = "permission_based";  // Always set to permission_based

      // Set budget based on selected card
      if (selectedCard.card1) {
        budget = 20;
      } else if (selectedCard.card2) {
        budget = 50;
      } else if (selectedCard.card3) {
        budget = 100;
      }

      console.log("Creating playbook with values:", {
        strategy: selectedStrategy,
        budget,
        deliveryType,
        hyper_personalization: true // Always true
      });

      const response = await fetch("/api/playbooks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: selectedStrategy,
          description: `Playbook for ${selectedStrategy.toLowerCase()} strategy`,
          budget: budget,
          sending_mode: deliveryType,
          hyper_personalization: true, // Always set to true
          user_id: userId,
          organization_id: organizationId,
          template: null,
          cta_link: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create playbook");
      }

      console.log("Playbook created successfully:", data.playbook);
      toast.success("Playbook created successfully!");
      setPlaybookId(data.playbook._id);
    } catch (error) {
      console.error("Error creating playbook:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create playbook"
      );
      throw error;
    }
  };

  const handleNextClick = async () => {
    try {
      let selectedStrategy = "";

      if (selectedCard.card1) selectedStrategy = "Retention Rewards";
      else if (selectedCard.card2) selectedStrategy = "Pipeline Accelerator";
      else if (selectedCard.card3) selectedStrategy = "Engagement Booster";
      else {
        toast.error("Please select a strategy");
        return;
      }

      await createPlaybook(selectedStrategy);

      setBlock({
        ...block,
        giftVisible: true,
      });
    } catch (error) {
      console.error("Error in handleNextClick:", error);
      // Error is already handled in createPlaybook
    }
  };

  useEffect(() => {
    if(!isLoadingCookies){
    if (block.giftVisible) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }
  }, [block.giftVisible, isLoadingCookies]);

  return (
    <div
      className={`${
        block.giftStrategyVisible && block.giftVisible ? "h-fit pt-72 " : block.giftStrategyVisible ? "block h-screen pt-72 " : "hidden"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        {/* //! --------- Select Playbook Text --------- */}

        {/* //! --------- Choose Gifting Strategy --------- */}
        <section className="flex justify-center items-center gap-12 mb-12">
          <Card
            title="Retention Rewards"
            budget={20}
            categories={["Catalog 1", "Catalog 2", "Catalog 3"]}
            personalization={true}
            deliveryType="Permission-Based"
            ctaTracking="--"
            printOptions="--"
            onClick={() =>
              setSelectedCard({
                ...selectedCard,
                card1: !selectedCard.card1,
                card2: false,
                card3: false,
              })
            }
            selected={selectedCard.card1}
          />
          <Card
            title="Loyalty Program"
            budget={50}
            categories={["Catalog 1", "Catalog 2", "Catalog 3"]}
            personalization={true}
            deliveryType="Permission-Based"
            ctaTracking="--"
            printOptions="--"
            onClick={() =>
              setSelectedCard({
                ...selectedCard,
                card2: !selectedCard.card2,
                card1: false,
                card3: false,
              })
            }
            selected={selectedCard.card2}
          />
          <Card
            title="Customer Appreciation"
            budget={100}
            categories={["Catalog 1", "Catalog 2", "Catalog 3"]}
            personalization={true}
            deliveryType="Permission-Based"
            ctaTracking="--"
            printOptions="--"
            onClick={() =>
              setSelectedCard({
                ...selectedCard,
                card3: !selectedCard.card3,
                card1: false,
                card2: false,
              })
            }
            selected={selectedCard.card3}
          />
        </section>

        {/* //! --------- Create Playbook --------- */}
        {/* Hidden for now until create playbook page is ready
        <div className="border-[#D2CEFE] border-[1px] mt-3 font-medium rounded-lg bg-[#F0ECF9] py-2.5 px-4 flex justify-between items-center w-[1000px] mx-auto hidden">
          <p className="">
            Didn't find your Gift Playbook? No worries—let's create one together!
          </p>
          <button className=" text-[#344054] hover:bg-primary-xlight duration-300  px-5 py-2.5 rounded-lg border-primary-light border-[1px]  text-sm">
            Create Playbook
          </button>
        </div>
        */}
        {/* //! --------- Button --------- */}
        {!block.giftVisible &&
          (selectedCard.card1 || selectedCard.card2 || selectedCard.card3 ? (
            <button
              onClick={handleNextClick}
              className="flex mx-auto mt-16 hover:opacity-95 text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg"
            >
              <Image
                src="/svgs/Shimmer.svg"
                alt="Shimmer"
                width={24}
                height={24}
              />
              Next
            </button>
          ) : (
            <div></div>
          ))}
      </div>
    </div>
  );
}
