(function () {
  var sliderTimer = null;

  function initHomeSlider() {
    var slideList = document.querySelector('.slidelist');
    if (!slideList) {
      return;
    }

    var slides = slideList.querySelectorAll('.slideimg');
    if (slides.length < 2) {
      return;
    }

    var currentIndex = 0;

    if (sliderTimer) {
      window.clearInterval(sliderTimer);
    }

    sliderTimer = window.setInterval(function () {
      var slideWidth = slides[0].getBoundingClientRect().width || 900;
      currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
      slideList.style.transition = 'left 400ms';
      slideList.style.left = currentIndex * -slideWidth + 'px';
    }, 2000);
  }

  function labelPageNavigation() {
    var sections = document.querySelectorAll('#number, #number2');

    sections.forEach(function (section) {
      section.setAttribute('role', 'navigation');
      section.setAttribute('aria-label', 'Page navigation');

      section.querySelectorAll('a').forEach(function (link) {
        var label = link.textContent.trim();
        if (label && !link.getAttribute('aria-label')) {
          link.setAttribute('aria-label', 'Go to page ' + label);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHomeSlider();
    labelPageNavigation();
  });

  document.addEventListener('cms:rendered', function () {
    initHomeSlider();
    labelPageNavigation();
  });
})();
