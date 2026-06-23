(function () {
  const publicSiteUrl = 'https://hayeon.kr/';

  function ready(callback) {
    if (window.CMS && window.h && window.createClass) {
      callback(window.CMS, window.h, window.createClass);
      return;
    }

    window.addEventListener('load', function () {
      if (window.CMS && window.h && window.createClass) {
        callback(window.CMS, window.h, window.createClass);
      }
    });
  }

  function toPlain(value) {
    if (value && typeof value.toJS === 'function') return value.toJS();
    if (value && typeof value.toArray === 'function') return value.toArray().map(toPlain);
    if (value && typeof value.toObject === 'function') return value.toObject();
    return value;
  }

  function text(value, fallback) {
    if (value === null || value === undefined) return fallback || '';
    const stringValue = String(value).trim();
    return stringValue || fallback || '';
  }

  function imagePreviewUrl(value) {
    const imagePath = text(value);
    if (!imagePath) return '';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;

    const normalized = imagePath.replace(/^\/+/, '');
    return new URL(normalized, publicSiteUrl).href;
  }

  function getEntryData(entry) {
    const raw = entry && typeof entry.getIn === 'function'
      ? entry.getIn(['data'])
      : null;
    return toPlain(raw) || {};
  }

  ready(function (CMS, h, createClass) {
    CMS.registerPreviewStyle('/admin/preview.css');

    function MetaPill(props) {
      if (!text(props.value)) return null;
      return h('span', { className: 'cms-preview__pill' }, `${props.label}: ${props.value}`);
    }

    function InfoLine(props) {
      if (!text(props.value)) return null;
      return h('p', { className: 'cms-preview__text' }, [
        h('span', { className: 'cms-preview__label', key: 'label' }, `${props.label}: `),
        h('span', { key: 'value' }, props.value),
      ]);
    }

    function ImageCard(props) {
      const item = props.item || {};
      const imagePath = text(item.image);
      const previewUrl = imagePreviewUrl(imagePath);
      const originalUrl = text(item.originalUrl);
      const caption = text(item.caption || item.title || item.alt, '설명 없음');
      const location = text(item.location);
      const thumb = previewUrl
        ? h('img', {
          className: 'cms-preview__thumb',
          src: previewUrl,
          alt: text(item.alt || caption, 'preview image'),
          loading: 'lazy',
          onError(event) {
            event.currentTarget.classList.add('is-broken');
          },
        })
        : h('div', { className: 'cms-preview__no-image' }, '이미지 경로 없음');

      return h('article', { className: 'cms-preview__card' }, [
        h('div', { className: 'cms-preview__thumb-wrap', key: 'image' }, originalUrl
          ? h('a', {
            className: 'cms-preview__thumb-link',
            href: originalUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            title: '원본 이미지 새 창으로 열기',
          }, thumb)
          : thumb),
        h('div', { className: 'cms-preview__card-body', key: 'body' }, [
          h('p', { className: 'cms-preview__caption', key: 'caption' }, caption),
          h(InfoLine, { label: '장소', value: location, key: 'location' }),
          h(InfoLine, { label: 'image', value: imagePath || '없음', key: 'imagePath' }),
          h(InfoLine, { label: 'preview URL', value: previewUrl || '없음', key: 'previewUrl' }),
          h(InfoLine, {
            label: 'originalUrl',
            value: originalUrl ? '있음' : '없음',
            key: 'originalState',
          }),
          originalUrl ? h('a', {
            className: 'cms-preview__original',
            href: originalUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            key: 'originalLink',
          }, '원본 이미지 새 창으로 열기') : null,
          h(InfoLine, { label: 'link', value: text(item.href), key: 'href' }),
        ]),
      ]);
    }

    function SectionPreview(props) {
      const section = props.section || {};
      const items = Array.isArray(section.items) ? section.items : [];
      const title = text(section.title, `섹션 ${props.index + 1}`);
      const type = text(section.type, 'type 없음');

      return h('section', { className: 'cms-preview__section' }, [
        h('h2', { className: 'cms-preview__section-title', key: 'title' }, [
          h('span', { key: 'titleText' }, title),
          h('span', { className: 'cms-preview__section-type', key: 'type' }, type),
        ]),
        items.length
          ? h('div', { className: 'cms-preview__grid', key: 'grid' },
            items.map((item, itemIndex) => h(ImageCard, {
              item,
              key: `${props.index}-${itemIndex}`,
            })))
          : h('div', { className: 'cms-preview__empty', key: 'empty' }, '표시할 사진 항목이 없습니다.'),
      ]);
    }

    function PagesPreview(props) {
      const data = getEntryData(props.entry);
      const sections = Array.isArray(data.sections) ? data.sections : [];
      const navigation = data.navigation || {};
      const audio = data.audio || {};

      return h('main', { className: 'cms-preview' }, [
        h('header', { className: 'cms-preview__header', key: 'header' }, [
          h('p', { className: 'cms-preview__eyebrow', key: 'eyebrow' }, text(data.pageType, 'page')),
          h('h1', { className: 'cms-preview__title', key: 'title' }, text(data.title || data.id, '제목 없음')),
          data.description
            ? h('p', { className: 'cms-preview__description', key: 'description' }, data.description)
            : null,
          h('div', { className: 'cms-preview__meta', key: 'meta' }, [
            h(MetaPill, { label: 'HTML', value: text(data.sourceHtml), key: 'sourceHtml' }),
            h(MetaPill, { label: '정렬', value: text(data.displayOrder), key: 'displayOrder' }),
            h(MetaPill, { label: '상태', value: text(data.status), key: 'status' }),
            h(MetaPill, { label: '이전', value: text(navigation.prev), key: 'prev' }),
            h(MetaPill, { label: '다음', value: text(navigation.next), key: 'next' }),
            h(MetaPill, { label: '오디오', value: text(audio.src), key: 'audio' }),
          ]),
        ]),
        sections.length
          ? sections.map((section, index) => h(SectionPreview, { section, index, key: index }))
          : h('div', { className: 'cms-preview__empty', key: 'empty' }, '등록된 섹션이 없습니다.'),
      ]);
    }

    CMS.registerPreviewTemplate('pages', createClass({
      render() {
        return h(PagesPreview, { entry: this.props.entry });
      },
    }));

    if (window.CMS_MANUAL_INIT && typeof CMS.init === 'function') {
      CMS.init();
    }
  });
}());
