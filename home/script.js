// Velvet Vows - Parallel Axes & Timeline Animation

document.addEventListener("DOMContentLoaded", () => {
  // --- Parallel Axes (Parallax) System ---
  let scrollY = 0;
  let mouseX = 0, mouseY = 0;
  let ticking = false;
  let hoverActive = false;
  let autoScrollActive = true;

  const isMobile = window.innerWidth <= 768;

  // Elements
  const heroVid = document.querySelector(".hero-video-container");
  const masterItems = document.querySelectorAll(".master-item");
  const bg1 = document.querySelector(".backdrop-1 .parallax-bg-wrapper");
  const bg2 = document.querySelector(".backdrop-2 .parallax-bg-wrapper");
  const scrollIndicator = document.querySelector(".scroll-indicator");
  
  // Timeline Elements
  const vineSection = document.querySelector('.vine-timeline');
  const activePath = document.getElementById('vineActiveCurve');
  const bgPath = document.getElementById('vineBackgroundCurve');
  const vineEvents = document.querySelectorAll('.vine-event');
  
  let pathLength = 0;
  if (activePath && bgPath) {
    pathLength = bgPath.getTotalLength();
    activePath.style.strokeDasharray = pathLength;
    activePath.style.strokeDashoffset = pathLength;
  }

  // --- Auto-scroll Nudge System ---
  function startAutoScroll() {
    if (autoScrollActive && window.scrollY < 600) {
      window.scrollBy(0, 0.5); // Very slow, elegant scroll
      requestAnimationFrame(startAutoScroll);
    }
  }

  // Stop auto-scroll on interaction
  const stopAutoScroll = () => {
    autoScrollActive = false;
    window.removeEventListener("wheel", stopAutoScroll);
    window.removeEventListener("touchstart", stopAutoScroll);
    window.removeEventListener("mousedown", stopAutoScroll);
    window.removeEventListener("keydown", stopAutoScroll);
  };

  window.addEventListener("wheel", stopAutoScroll);
  window.addEventListener("touchstart", stopAutoScroll);
  window.addEventListener("mousedown", stopAutoScroll);
  window.addEventListener("keydown", stopAutoScroll);

  // Trigger the nudge after the hero video plays for a bit (acting as the 'first loop')
  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    heroVideo.addEventListener('timeupdate', function onTimeUpdate() {
      // If video has played more than 8 seconds or is nearing end
      if (heroVideo.currentTime > 8 && window.scrollY === 0) {
        startAutoScroll();
        heroVideo.removeEventListener('timeupdate', onTimeUpdate);
      }
    });
  } else {
    // Fallback delay if video is missing
    setTimeout(() => {
      if (window.scrollY === 0) startAutoScroll();
    }, 8000);
  }

  // Scroll Tracking
  window.addEventListener("scroll", () => {
    scrollY = window.pageYOffset;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateParallax();
        updateTimeline();
        if (scrollIndicator) {
          if (scrollY > 50) {
            scrollIndicator.style.opacity = "0";
            scrollIndicator.style.pointerEvents = "none";
          } else {
            scrollIndicator.style.opacity = "1";
          }
        }
        ticking = false;
      });
      ticking = true;
    }
  });

  // Mouse Tracking (Desktop Only)
  if (!isMobile) {
    document.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      
      const target = e.target;
      hoverActive = !!target.closest('.master-item');
      
      if (hoverActive && !ticking) {
        window.requestAnimationFrame(updateMouseParallax);
      }
    });

    // Reset mouse when leaving
    document.addEventListener("mouseleave", () => {
      hoverActive = false;
      masterItems.forEach((item) => {
        item.style.transform = item.style.transform.split(' rotateX')[0];
      });
    });
  }

  // Core Parallax Execution
  function updateParallax() {
    // Note: Removed the "if (isMobile) return;" check so animation fires on mobile!

    // Hero mapping
    if (heroVid) {
      heroVid.style.transform = `translateY(${scrollY * 0.4}px)`;
    }

    // Ethereal floating backgrounds
    if (bg1) bg1.style.transform = `translateY(${scrollY * 0.1}px) scale(1.1)`;
    if (bg2) bg2.style.transform = `translateY(${scrollY * 0.15}px) scale(1.1)`;

    // Aggressive scattered floating animation for depth
    masterItems.forEach((item, index) => {
      // vastly different speeds per card mimicking varying Z-depth distances
      const speeds = [0.15, -0.05, 0.18, 0.04, 0.22, -0.08, 0.12, 0.07];
      const speed = speeds[index % speeds.length];
      const yMove = -(scrollY * speed); 
      const direction = index % 2 === 0 ? 1 : -1;
      const xMove = Math.sin(scrollY * 0.002) * 15 * direction;
      item.style.transform = `translate3d(${xMove}px, ${yMove}px, 0)`;
    });
  }

  function updateMouseParallax() {
    if (isMobile || !hoverActive) return;
    const intensity = 0.6;
    
    masterItems.forEach((item) => {
      const baseTransform = item.style.transform.split(' rotateX')[0] || item.style.transform;
      item.style.transform = `${baseTransform} rotateX(${-mouseY * 3}deg) rotateY(${mouseX * 3}deg)`;
    });
  }

  // Core Timeline Execution
  function updateTimeline() {
    if (!vineSection || !activePath) return;

    const rect = vineSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    let progress = 0;
    if (rect.top < windowHeight && rect.bottom > 0) {
      const timelineVisibleHeight = windowHeight - rect.top;
      const totalTimelineHeight = rect.height + windowHeight / 2;
      progress = timelineVisibleHeight / totalTimelineHeight;
      progress = Math.max(0, Math.min(1, progress * 1.2)); 
    }

    const drawOffset = pathLength * (1 - progress);
    activePath.style.strokeDashoffset = drawOffset;

    // Trigger Cards dynamically tied closely to the line's exact progress
    vineEvents.forEach((ev, idx) => {
      const threshold = 0.15 + (idx * 0.35); 
      if (progress > threshold) {
        ev.classList.add('visible');
      } else {
        ev.classList.remove('visible');
      }
    });
  }

  // Intersection Observer for graceful fading of elements on mobile
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('vine-event')) {
          entry.target.classList.add('visible');
        } else {
          entry.target.style.opacity = "1";
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Initial Setup / Observer Registration
  masterItems.forEach(item => {
    item.style.opacity = "0";
    item.style.transition = "opacity 0.8s ease";
    observer.observe(item);
  });

  // Ensure Video plays immediately
  const video = document.querySelector('.hero-video');
  if (video) {
    video.play().catch(e => console.log('Video autoplay blocked.'));
  }

  // Trigger initial frame calculation
  updateTimeline();
  updateParallax();

  // Auto-scroll nudge after 5 seconds if the user hasn't moved yet
  setTimeout(() => {
    if (window.scrollY === 0) {
      window.scrollTo({
        top: 400, // Nudge down 400px
        behavior: "smooth"
      });
    }
  }, 5000);
});
