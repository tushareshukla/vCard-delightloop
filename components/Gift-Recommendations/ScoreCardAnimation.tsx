import { useEffect } from "react";

function CountdownTracker(value: number) {
  const el = document.createElement("span");

  el.className = "flip-clock__piece";
  el.innerHTML =
    '<b class="flip-clock__card card"><b class="card__top"></b><b class="card__bottom"></b><b class="card__back"><b class="card__bottom"></b></b></b>';

  const top = el.querySelector(".card__top") as HTMLElement;
  const bottom = el.querySelector(".card__bottom") as HTMLElement;
  const back = el.querySelector(".card__back") as HTMLElement;
  const backBottom = el.querySelector(
    ".card__back .card__bottom"
  ) as HTMLElement;

  let currentValue = value;

  const update = (val: number) => {
    if (val !== currentValue) {
      if (currentValue >= 0) {
        back.setAttribute("data-value", String(currentValue));
        bottom.setAttribute("data-value", String(currentValue));
      }
      currentValue = val;
      top.innerText = String(currentValue);
      backBottom.setAttribute("data-value", String(currentValue));

      el.classList.remove("flip");
      void el.offsetWidth;
      el.classList.add("flip");
    }
  };

  update(value);
  return { el, update };
}

export default function ScoreCardAnimation({ total }: { total: number }) {
  useEffect(() => {
    const container = document.createElement("div");
    container.className = "flip-clock";

    const trackers: { el: HTMLElement; update: (val: number) => void }[] = [];

    trackers.push(CountdownTracker(0));
    container.appendChild(trackers[0].el);

    let current = 0;

    const updateNumber = () => {
      if (current < total) {
        current += 1;

        // Calculate digits
        const digits = current.toString().split("").map(Number);

        // Add new cards if needed
        while (trackers.length < digits.length) {
          const newTracker = CountdownTracker(0);
          container.insertBefore(newTracker.el, container.firstChild);
          trackers.unshift(newTracker);
        }

        // Update all cards
        digits.forEach((digit, index) => {
          const trackerIndex = trackers.length - digits.length + index;
          if (trackerIndex >= 0) {
            trackers[trackerIndex].update(digit);
          }
        });

        // Speed control: fast until last 10 numbers
        const remaining = total - current;
        if (remaining > 10) {
          setTimeout(updateNumber, 2000); // Fast speed (50ms)
        } else {
          setTimeout(updateNumber, 2000); // Slow speed with animation (1s)
        }
      }
    };

    updateNumber(); // Start the animation

    const mount = document.getElementById("flip-clock-mount");
    if (mount) {
      mount.appendChild(container);
    }

    return () => {
      if (mount) {
        mount.innerHTML = "";
      }
    };
  }, [total]);

  return (
    <div id="flip-clock-mount" className="flex flex-row-reverse w-fit"></div>
  );
}
