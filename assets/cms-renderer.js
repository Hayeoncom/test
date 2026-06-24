(function () {
  function findSection(data, type) {
    if (type === 'gallery' && Array.isArray(data.gallery)) {
      return {
        type: 'gallery',
        title: data.title || '',
        items: data.gallery,
      };
    }

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
    updateOriginalImageLink(img, item);
  }

  function isHttpUrl(value) {
    return /^https?:\/\//i.test(value);
  }

  function unwrapOriginalImageLink(link) {
    var parent = link.parentNode;
    if (!parent) {
      return null;
    }
    var image = link.querySelector('img');
    if (!image) {
      return null;
    }
    parent.insertBefore(image, link);
    parent.removeChild(link);
    return image;
  }

  function updateOriginalImageLink(img, item) {
    var originalUrl = typeof item.originalUrl === 'string' ? item.originalUrl.trim() : '';
    var currentLink = img.closest('a[data-original-image-link="true"]');

    if (currentLink && !originalUrl) {
      img = unwrapOriginalImageLink(currentLink) || img;
      img.removeAttribute('data-original-url');
      return;
    }

    if (!originalUrl) {
      img.removeAttribute('data-original-url');
      return;
    }

    if (!isHttpUrl(originalUrl)) {
      img.removeAttribute('data-original-url');
      return;
    }

    img.setAttribute('data-original-url', originalUrl);

    if (currentLink) {
      currentLink.setAttribute('href', originalUrl);
      currentLink.setAttribute('target', '_blank');
      currentLink.setAttribute('rel', 'noopener noreferrer');
      return;
    }

    if (img.closest('a')) {
      return;
    }

    var link = document.createElement('a');
    link.setAttribute('href', originalUrl);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.setAttribute('data-original-image-link', 'true');
    img.parentNode.insertBefore(link, img);
    link.appendChild(img);
  }

  function ensureTextNode(parent, selector, tagName) {
    var node = parent.querySelector(selector);
    if (!node) {
      node = document.createElement(tagName);
      parent.appendChild(node);
    }
    return node;
  }

  function getGallerySlots(contents) {
    return Array.prototype.slice.call(contents.children).filter(function (child) {
      return child.tagName === 'DIV' && /^img/.test(child.className || '');
    });
  }

  function getGalleryInsertBefore(contents) {
    return contents.querySelector('#number2');
  }

  function createGallerySlot(contents, template, index) {
    var slot = template ? template.cloneNode(true) : createEmptyGallerySlot(index);
    var image = slot.querySelector('img');
    var link = slot.querySelector('a[data-original-image-link="true"]');

    slot.className = 'img img' + index;
    slot.style.display = '';

    if (link) {
      image = unwrapOriginalImageLink(link) || image;
    }

    if (image) {
      image.removeAttribute('data-original-url');
    }

    var insertBefore = getGalleryInsertBefore(contents);
    contents.insertBefore(slot, insertBefore);
    return slot;
  }

  function createEmptyGallerySlot(index) {
    var slot = document.createElement('div');
    var list = document.createElement('ul');
    var item = document.createElement('li');
    var image = document.createElement('img');
    var location = document.createElement('p');
    var caption = document.createElement('span');

    slot.className = 'img img' + index;
    list.className = 'clearfix';
    item.appendChild(image);
    item.appendChild(location);
    item.appendChild(caption);
    list.appendChild(item);
    slot.appendChild(list);
    return slot;
  }

  function ensureGallerySlots(contents, count) {
    var slots = getGallerySlots(contents);
    var originalCount = slots.length;
    var template = slots[slots.length - 1];

    while (slots.length < count) {
      var slot = createGallerySlot(contents, template, slots.length);
      slots.push(slot);
    }

    if (slots.length > originalCount) {
      moveGalleryEndSpacing(slots);
    }

    return slots;
  }

  function moveGalleryEndSpacing(slots) {
    var endPadding = 0;

    slots.forEach(function (slot) {
      var caption = slot.querySelector('span');
      var padding = caption ? parseFloat(window.getComputedStyle(caption).paddingBottom) : 0;
      endPadding = Math.max(endPadding, isNaN(padding) ? 0 : padding);
    });

    if (!endPadding) {
      return;
    }

    slots.forEach(function (slot, index) {
      var caption = slot.querySelector('span');
      if (!caption) {
        return;
      }
      caption.style.paddingBottom = index === slots.length - 1 ? endPadding + 'px' : '0px';
    });
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
    var slots = ensureGallerySlots(contents, items.length);

    if (!slots.length || !items.length) {
      return;
    }

    items.forEach(function (item, index) {
      var slot = slots[index];
      var image = slot && slot.querySelector('img');
      if (!image) {
        return;
      }
      var li = image.closest('li') || image.parentElement;
      slot.style.display = '';
      li.style.display = '';
      updateImage(image, item);

      var location = ensureTextNode(li, 'p', 'p');
      var caption = ensureTextNode(li, 'span', 'span');
      location.textContent = item.location || '';
      caption.textContent = item.caption || '';
    });

    slots.slice(items.length).forEach(function (slot) {
      slot.style.display = 'none';
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
    var audioContainer = document.querySelector('.audio');
    if (data.audio.enabled === false || !data.audio.src) {
      if (audioContainer) {
        audioContainer.hidden = true;
      }
      return;
    }
    if (audioContainer) {
      audioContainer.hidden = false;
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
    setText('#generated-title', data.title || '');
    setText('.generated-page-description', data.description || '');
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
