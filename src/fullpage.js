import {useEffect, useRef} from "react";

function throttle(fn, delay) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last > delay) {
      last = now;
      fn(...args);
    }
  };
}

export function useFullPage() {
  const update = useRef(null);
  const index = useRef(0);
  const setCurrentIndex = (selectedIndex) => update.current(selectedIndex);
  const currentIndex = () => index.current;

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll(".section"));

    const indicatorGroup = document.createElement("div");
    indicatorGroup.className = "indicator-group";
    indicatorGroup.style.position = "fixed";
    indicatorGroup.style.top = "50%";
    indicatorGroup.style.right = "10px";
    indicatorGroup.style.zIndex = "1000";
    indicatorGroup.style.backgroundColor = "transparent";
    indicatorGroup.style.padding = "10px";
    indicatorGroup.style.borderRadius = "5px";
    indicatorGroup.style.transform = "translateY(-50%)";

    const dots = sections.map((section, index) => {
      const div = document.createElement("div");
      div.className = "indicator";
      div.style.cursor = "pointer";
      div.style.width = "12px";
      div.style.height = "12px";
      div.style.borderRadius = "50%";
      div.style.backgroundColor = "black";
      div.style.border = "0px solid #FEFAF1";
      div.style.marginBottom = "8px";
      div.addEventListener("click", () => {
        section.scrollIntoView({behavior: "smooth"});
        updateIndicators(index);
      });
      indicatorGroup.appendChild(div);
      return div;
    });

    const updateIndicators = (update.current = (selectedIndex) => {
      dots.forEach((dot, index) => {
        if (index === selectedIndex) {
          dot.style.border = "0px solid #FEFAF1";
        } else {
          dot.style.border = "4px solid #FEFAF1";
        }
      });
      index.current = selectedIndex;
    });

    document.body.appendChild(indicatorGroup);

    updateIndicators(0);

    const wheel = throttle((e) => {
      const currentIndex = sections.findIndex((section) => section.getBoundingClientRect().top === 0);
      const scrollUp = e.deltaY < 0;
      const targetIndex = scrollUp ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex >= 0 && targetIndex < sections.length) {
        sections[targetIndex].scrollIntoView({behavior: "smooth"});
        updateIndicators(targetIndex);
      }
    }, 1500);

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      wheel(e);
    };

    window.addEventListener("wheel", handleWheel, {passive: false});
    return () => {
      window.removeEventListener("wheel", handleWheel, {passive: false});
      indicatorGroup.remove();
    };
  }, []);

  return [currentIndex, setCurrentIndex];
}
