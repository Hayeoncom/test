(function () {
  function findSection(data, type) {
    return (data.sections || []).find(function (section) {
      return section.type === type;
    });
  }

  function showError(message) {
    console.error(message);
    var error = document.createElement('div');
    error.setAttribute('role', 'status');
    error.style.cssText = 'max-width:900px;margin:20px auto;padding:12px;border:1px solid #ddd;font:14px sans-serif;color:#333;';
    error.textContent = message;
    document.body.appendChild(error);
  }

  function setText(selector, value) {
    var node = document.querySelector(selector);
    if (node && typeof value === 'string') {
      node.textContent = value;
    }
  }

  function updateTitle(data) {
    if (data.title) {
      document.title = data.title;
    }
  }

  function updateImage(img, item) {
    if (!img || !item) {
      return;
    }
    if (item.image) {
      img.setAttribute('src', item.image);
    }
    img.setAttribute('alt', item.alt || '');
  }

  function ensureTextNode(parent, selector, tagName) {
    var node = parent.querySelector(selector);
    if (!node) {
      node = document.createElement(tagName);
      parent.appendChild(node);
    }
    return node;
  }

  function renderGallery(data) {
    var contents = document.querySelector('#contents');
    var section = findSection(data, 'gallery');
    if (!contents || !section) {
      return;
    }

    var items = (section.items || []).filter(function (item) {
      return item.visible !== false;
    });
    var images = Array.prototype.slice.call(contents.querySelectorAll('img'));

    if (!images.length || !items.length) {
      return;
    }

    items.forEach(function (item, index) {
      var image = images[index];
      if (!image) {
        return;
      }
      var li = image.closest('li') || image.parentElement;
      li.style.display = '';
      updateImage(image, item);

      var location = ensureTextNode(li, 'p', 'p');
      var caption = ensureTextNode(li, 'span', 'span');
      location.textContent = item.location || '';
      caption.textContent = item.caption || '';
    });

    images.slice(items.length).forEach(function (image) {
      var li = image.closest('li') || image.parentElement;
      li.style.display = 'none';
    });
  }

  function renderHome(data) {
    setText('#header h1', data.subtitle || '');
    setText('#footer p', data.footer || '');

    var slider = findSection(data, 'slider');
    if (slider) {
      var slideList = document.querySelector('.slidelist');
      var slides = slideList ? Array.prototype.slice.call(slideList.querySelectorAll('.slideimg')) : [];
      var items = (slider.items || []).filter(function (item) {
        return item.visible !== false;
      });

      items.forEach(function (item, index) {
        var slide = slides[index] || slides[slides.length - 1].cloneNode(true);
        if (!slides[index]) {
          slideList.appendChild(slide);
          slides.push(slide);
        }
        slide.style.display = '';
        updateImage(slide.querySelector('img'), item);
      });

      slides.slice(items.length).forEach(function (slide) {
        slide.style.display = 'none';
      });
    }

    renderTravelCards(findSection(data, 'travelCards'));
    renderDocumentCards(findSection(data, 'documentCards'));
  }

  function renderTravelCards(section) {
    if (!section) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('#contents1 > div[class^="imgli"]'));
    var items = (section.items || []).filter(function (item) {
      return item.visible !== false;
    });

    items.forEach(function (item, index) {
      var card = cards[index];
      if (!card) {
        return;
      }
      card.style.display = '';
      var link = card.querySelector('a');
      if (link && item.href) {
        link.setAttribute('href', item.href);
      }
      updateImage(card.querySelector('img'), item);
      setScopedText(card, 'span', item.title || '');
      setScopedText(card, 'p', item.meta || '');
    });

    cards.slice(items.length).forEach(function (card) {
      card.style.display = 'none';
    });
  }

  function renderDocumentCards(section) {
    if (!section) {
      return;
    }

    var cards = Array.prototype.slice.call(document.querySelectorAll('#contents2 > div.thum1'));
    var items = (section.items || []).filter(function (item) {
      return item.visible !== false;
    });

    items.forEach(function (item, index) {
      var card = cards[index];
      if (!card) {
        return;
      }
      card.style.display = '';
      card.querySelectorAll('a').forEach(function (link) {
        if (item.href) {
          link.setAttribute('href', item.href);
        }
      });
      updateImage(card.querySelector('img'), item);
      setScopedText(card, 'h3', item.title || '');
      setScopedText(card, 'p', item.camera || '');
      setScopedText(card, 'h2', item.date || '');
    });

    cards.slice(items.length).forEach(function (card) {
      card.style.display = 'none';
    });
  }

  function setScopedText(root, selector, value) {
    var node = root.querySelector(selector);
    if (node && typeof value === 'string') {
      node.textContent = value;
    }
  }

  function renderAudio(data) {
    if (!data.audio) {
      return;
    }
    var source = document.querySelector('audio source');
    if (source && data.audio.src) {
      source.setAttribute('src', data.audio.src);
      source.setAttribute('type', data.audio.type || 'audio/mp3');
      if (source.parentElement && source.parentElement.load) {
        source.parentElement.load();
      }
    }
  }

  function renderPage(data) {
    updateTitle(data);
    renderAudio(data);
    if (data.pageType === 'home') {
      renderHome(data);
    } else {
      setText('.animated-title .content', data.description || '');
      renderGallery(data);
    }
    document.dispatchEvent(new CustomEvent('cms:rendered', { detail: data }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = document.body && document.body.getAttribute('data-content');
    if (!path) {
      return;
    }

    fetch(path)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('CMS content load failed: ' + path);
        }
        return response.json();
      })
      .then(renderPage)
      .catch(function (error) {
        showError(error.message);
      });
  });
})();
