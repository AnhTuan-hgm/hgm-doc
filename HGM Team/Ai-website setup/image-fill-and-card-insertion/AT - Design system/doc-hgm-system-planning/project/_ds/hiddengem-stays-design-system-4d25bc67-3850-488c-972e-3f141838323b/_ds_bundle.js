/* @ds-bundle: {"format":3,"namespace":"HiddenGemStaysDesignSystem_4d25bc","components":[],"sourceHashes":{"assets/icons.js":"b100019c0d95","ui_kits/booking_app/AppScreens.jsx":"ae9af2c3d2a3","ui_kits/marketing_site/Cards.jsx":"17fcf4fd6b7d","ui_kits/marketing_site/Chrome.jsx":"59695d192b51","ui_kits/marketing_site/Pages.jsx":"824bd9c2b22a","ui_kits/marketing_site/Primitives.jsx":"3530df83c99c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.HiddenGemStaysDesignSystem_4d25bc = window.HiddenGemStaysDesignSystem_4d25bc || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// assets/icons.js
try { (() => {
// Auto-generated. Inline Phosphor SVG paths so <Icon> can render them without network dependence.
// Source: @phosphor-icons/core@2.1.1, regular weight (heart-filled = fill variant).
// Usage: <span dangerouslySetInnerHTML={{__html: `<svg viewBox="0 0 256 256">${ICONS[name]}</svg>`}} />
window.ICONS = {
  'arrow-right': `<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>`,
  'building': `<path d="M164,80a28,28,0,1,0-28-28A28,28,0,0,0,164,80Zm0-40a12,12,0,1,1-12,12A12,12,0,0,1,164,40Zm90.88,155.92-54.56-92.08A15.87,15.87,0,0,0,186.55,96h0a15.85,15.85,0,0,0-13.76,7.84L146.63,148l-44.84-76.1a16,16,0,0,0-27.58,0L1.11,195.94A8,8,0,0,0,8,208H248a8,8,0,0,0,6.88-12.08ZM88,80l23.57,40H64.43ZM22,192l33-56h66l18.74,31.8,0,0L154,192Zm150.57,0-16.66-28.28L186.55,112,234,192Z"></path>`,
  'calendar': `<path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path>`,
  'camera': `<path d="M208,56H180.28L166.65,35.56A8,8,0,0,0,160,32H96a8,8,0,0,0-6.65,3.56L75.71,56H48A24,24,0,0,0,24,80V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V80A24,24,0,0,0,208,56Zm8,136a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80a8,8,0,0,1,8-8H80a8,8,0,0,0,6.66-3.56L100.28,48h55.43l13.63,20.44A8,8,0,0,0,176,72h32a8,8,0,0,1,8,8ZM128,88a44,44,0,1,0,44,44A44.05,44.05,0,0,0,128,88Zm0,72a28,28,0,1,1,28-28A28,28,0,0,1,128,160Z"></path>`,
  'check-verified': `<path d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11ZM173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"></path>`,
  'check': `<path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>`,
  'chevron-down': `<path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>`,
  'chevron-right': `<path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>`,
  'compass': `<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM172.42,72.84l-64,32a8.05,8.05,0,0,0-3.58,3.58l-32,64A8,8,0,0,0,80,184a8.1,8.1,0,0,0,3.58-.84l64-32a8.05,8.05,0,0,0,3.58-3.58l32-64a8,8,0,0,0-10.74-10.74ZM138,138,97.89,158.11,118,118l40.15-20.07Z"></path>`,
  'filter': `<path d="M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm106.18,74.58A8,8,0,0,0,144,136v58.66L112,216V136a8,8,0,0,0-2.16-5.47L40,56H216Z"></path>`,
  'heart-filled': `<path d="M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z"></path>`,
  'heart': `<path d="M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z"></path>`,
  'home': `<path d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"></path>`,
  'map': `<path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z"></path>`,
  'marker-pin': `<path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"></path>`,
  'menu': `<path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>`,
  'message': `<path d="M128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"></path>`,
  'minus': `<path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>`,
  'plus': `<path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>`,
  'search': `<path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>`,
  'share': `<path d="M176,160a39.89,39.89,0,0,0-28.62,12.09l-46.1-29.63a39.8,39.8,0,0,0,0-28.92l46.1-29.63a40,40,0,1,0-8.66-13.45l-46.1,29.63a40,40,0,1,0,0,55.82l46.1,29.63A40,40,0,1,0,176,160Zm0-128a24,24,0,1,1-24,24A24,24,0,0,1,176,32ZM64,152a24,24,0,1,1,24-24A24,24,0,0,1,64,152Zm112,72a24,24,0,1,1,24-24A24,24,0,0,1,176,224Z"></path>`,
  'star': `<path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Zm-15.34,5.47-48.7,42a8,8,0,0,0-2.56,7.91l14.88,62.8a.37.37,0,0,1-.17.48c-.18.14-.23.11-.38,0l-54.72-33.65a8,8,0,0,0-8.38,0L69.09,215.94c-.15.09-.19.12-.38,0a.37.37,0,0,1-.17-.48l14.88-62.8a8,8,0,0,0-2.56-7.91l-48.7-42c-.12-.1-.23-.19-.13-.5s.18-.27.33-.29l63.92-5.16A8,8,0,0,0,103,91.86l24.62-59.61c.08-.17.11-.25.35-.25s.27.08.35.25L153,91.86a8,8,0,0,0,6.75,4.92l63.92,5.16c.15,0,.24,0,.33.29S224,102.63,223.84,102.73Z"></path>`,
  'umbrella': `<path d="M240,126.63A112.44,112.44,0,0,0,51.75,53.75a111.56,111.56,0,0,0-35.7,72.88A16,16,0,0,0,32,144h88v56a32,32,0,0,0,64,0,8,8,0,0,0-16,0,16,16,0,0,1-32,0V144h88a16,16,0,0,0,16-17.37ZM32,128l0,0A96.43,96.43,0,0,1,193.4,65.52,95.32,95.32,0,0,1,224,128Z"></path>`,
  'users': `<path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z"></path>`,
  'wifi': `<path d="M140,204a12,12,0,1,1-12-12A12,12,0,0,1,140,204ZM237.08,87A172,172,0,0,0,18.92,87,8,8,0,0,0,29.08,99.37a156,156,0,0,1,197.84,0A8,8,0,0,0,237.08,87ZM205,122.77a124,124,0,0,0-153.94,0A8,8,0,0,0,61,135.31a108,108,0,0,1,134.06,0,8,8,0,0,0,11.24-1.3A8,8,0,0,0,205,122.77Zm-32.26,35.76a76.05,76.05,0,0,0-89.42,0,8,8,0,0,0,9.42,12.94,60,60,0,0,1,70.58,0,8,8,0,1,0,9.42-12.94Z"></path>`,
  'x-close': `<path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>`
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "assets/icons.js", error: String((e && e.message) || e) }); }

// ui_kits/booking_app/AppScreens.jsx
try { (() => {
// Booking app — in-product UI (authenticated surfaces)

const AppShell = ({
  children,
  current,
  onNav,
  user
}) => {
  const tabs = [{
    id: 'explore',
    l: 'Explore',
    ic: 'compass'
  }, {
    id: 'trips',
    l: 'Trips',
    ic: 'marker-pin'
  }, {
    id: 'saved',
    l: 'Saved',
    ic: 'heart'
  }, {
    id: 'messages',
    l: 'Messages',
    ic: 'message'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      background: 'var(--bg-page)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(251,249,245,0.85)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1440,
      margin: '0 auto',
      padding: '14px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4,
      background: 'var(--sand-50)',
      borderRadius: 999,
      padding: 4
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    onClick: () => onNav(t.id),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 16px',
      borderRadius: 999,
      cursor: 'pointer',
      background: current === t.id ? 'var(--bg-surface)' : 'transparent',
      boxShadow: current === t.id ? 'var(--shadow-xs)' : 'none',
      color: current === t.id ? 'var(--forest-900)' : 'var(--fg-tertiary)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      fontWeight: 500,
      transition: 'all 180ms'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: t.ic,
    size: 16,
    style: {
      opacity: current === t.id ? 1 : 0.7
    }
  }), t.l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 18,
    style: {
      color: 'var(--forest-700)',
      cursor: 'pointer'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: 'url(https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format) center/cover'
    }
  })))), /*#__PURE__*/React.createElement("main", null, children));
};
const ExploreScreen = ({
  onOpen
}) => {
  const [cat, setCat] = React.useState('all');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1440,
      margin: '0 auto',
      padding: '28px 32px 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 18,
    style: {
      color: 'var(--fg-tertiary)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search stays, regions, hosts\u2026",
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--forest-900)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--fg-tertiary)',
      padding: '3px 6px',
      border: '1px solid var(--border-default)',
      borderRadius: 4
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "filter"
  }, "Filters"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "map"
  }, "Map")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(CategoryBar, {
    active: cat,
    onSet: setCat
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20
    }
  }, PROPERTIES.concat(PROPERTIES.slice(0, 2)).map((p, i) => /*#__PURE__*/React.createElement(PropertyCard, {
    key: i,
    p: p,
    onOpen: () => onOpen(p)
  }))));
};
const TripsScreen = () => /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1024,
    margin: '0 auto',
    padding: '40px 32px 80px'
  }
}, /*#__PURE__*/React.createElement(Eyebrow, null, "Your trips"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: '-0.012em',
    marginTop: 8,
    marginBottom: 32
  }
}, "Coming up next."), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }
}, [{
  p: PROPERTIES[0],
  dates: 'Thu, Apr 24 — Sun, Apr 27',
  status: 'confirmed'
}, {
  p: PROPERTIES[4],
  dates: 'Jun 12 — Jun 18',
  status: 'pending'
}].map((t, i) => /*#__PURE__*/React.createElement("div", {
  key: i,
  style: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-sm)',
    padding: 20,
    display: 'flex',
    gap: 20
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    width: 200,
    aspectRatio: '4/3',
    borderRadius: 10,
    background: `url(${t.p.img}) center/cover`,
    flex: 'none'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 8,
    marginBottom: 10
  }
}, /*#__PURE__*/React.createElement(Badge, {
  variant: t.status === 'confirmed' ? 'verified' : 'neutral'
}, t.status === 'confirmed' ? '✓ Confirmed' : 'Pending host'), t.p.gem && /*#__PURE__*/React.createElement(Badge, {
  variant: "gem"
}, "\u2756 Hidden Gem")), /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 24,
    fontWeight: 500,
    color: 'var(--forest-900)',
    marginBottom: 4
  }
}, t.p.name), /*#__PURE__*/React.createElement("div", {
  style: {
    color: 'var(--fg-tertiary)',
    fontSize: 14
  }
}, t.p.loc, " \xB7 ", t.dates)), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    gap: 8
  }
}, /*#__PURE__*/React.createElement(Button, {
  variant: "primary",
  size: "sm"
}, "View trip"), /*#__PURE__*/React.createElement(Button, {
  variant: "secondary",
  size: "sm",
  icon: "message"
}, "Message host")))))));
const CheckoutScreen = ({
  property,
  onConfirm,
  onBack
}) => {
  const p = property || PROPERTIES[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 980,
      margin: '0 auto',
      padding: '32px 32px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onBack,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      cursor: 'pointer',
      color: 'var(--forest-700)',
      fontSize: 14,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 14,
    style: {
      transform: 'rotate(180deg)'
    }
  }), " Back to stay"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 38,
      fontWeight: 400,
      letterSpacing: '-0.012em',
      marginBottom: 28
    }
  }, "Request to book."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement(Section, {
    title: "Your trip"
  }, /*#__PURE__*/React.createElement(Row, {
    label: "Dates",
    value: "Thu, Apr 24 \u2014 Sun, Apr 27",
    action: "Edit"
  }), /*#__PURE__*/React.createElement(Row, {
    label: "Guests",
    value: "2 adults",
    action: "Edit"
  })), /*#__PURE__*/React.createElement(Section, {
    title: "Pay with"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
      border: '1px solid var(--forest-500)',
      borderRadius: 10,
      boxShadow: 'var(--shadow-gold-glow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 24,
      background: 'var(--forest-700)',
      borderRadius: 4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 14,
      color: 'var(--forest-900)'
    }
  }, "Visa \xB7 \xB7 \xB7 \xB7 4912"), /*#__PURE__*/React.createElement(Icon, {
    name: "check-verified",
    size: 18,
    style: {
      color: 'var(--forest-500)'
    }
  }))), /*#__PURE__*/React.createElement(Section, {
    title: "Message your host"
  }, /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Tell Mara why you're coming \u2014 she loves a good story.",
    style: {
      width: '100%',
      minHeight: 100,
      padding: 14,
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      resize: 'vertical',
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--forest-900)',
      outline: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      fontSize: 13,
      color: 'var(--fg-secondary)',
      padding: 16,
      background: 'var(--sand-50)',
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-verified",
    size: 18,
    style: {
      color: 'var(--forest-500)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", null, "Free cancellation until ", /*#__PURE__*/React.createElement("b", null, "Apr 21"), ". After that, cancel by Apr 23 for a 50% refund.")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "xl",
    onClick: onConfirm,
    style: {
      width: '100%',
      justifyContent: 'center'
    }
  }, "Request to book")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 100,
      alignSelf: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      paddingBottom: 18,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      borderRadius: 10,
      background: `url(${p.img}) center/cover`,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      fontWeight: 500,
      color: 'var(--forest-900)'
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--fg-tertiary)'
    }
  }, p.loc), /*#__PURE__*/React.createElement(Rating, {
    value: p.rating,
    count: p.reviews,
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontSize: 14,
      color: 'var(--fg-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "$", p.price, " \xD7 3 nights"), /*#__PURE__*/React.createElement("span", null, "$", p.price * 3)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Cleaning fee"), /*#__PURE__*/React.createElement("span", null, "$60")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Service fee"), /*#__PURE__*/React.createElement("span", null, "$48")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTop: '1px solid var(--border-subtle)',
      fontWeight: 600,
      color: 'var(--forest-900)',
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", null, "$", p.price * 3 + 108)))))));
};
const Section = ({
  title,
  children
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    fontWeight: 500,
    color: 'var(--forest-900)',
    marginBottom: 12
  }
}, title), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  }
}, children));
const Row = ({
  label,
  value,
  action
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    border: '1px solid var(--border-subtle)',
    borderRadius: 10
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--forest-900)',
    marginBottom: 2
  }
}, label), /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 14,
    color: 'var(--fg-secondary)'
  }
}, value)), action && /*#__PURE__*/React.createElement("span", {
  style: {
    fontSize: 13,
    color: 'var(--forest-500)',
    fontWeight: 500,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
    cursor: 'pointer'
  }
}, action));
const ConfirmationScreen = ({
  property,
  onBack
}) => {
  const p = property || PROPERTIES[0];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640,
      margin: '60px auto',
      padding: '0 32px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 72,
      height: 72,
      borderRadius: 999,
      background: 'var(--forest-50)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-verified",
    size: 32,
    style: {
      color: 'var(--forest-500)'
    }
  })), /*#__PURE__*/React.createElement(Eyebrow, null, "Request sent"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 48,
      fontWeight: 400,
      letterSpacing: '-0.015em',
      margin: '12px 0 14px'
    }
  }, "Mara is checking her calendar."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.6,
      color: 'var(--fg-secondary)',
      marginBottom: 32,
      maxWidth: 440,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  }, "You'll hear back within 24 hours. We'll message you here. In the meantime \u2014 start dreaming about that clawfoot tub."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onBack
  }, "See your trips"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg"
  }, "Message host")));
};
Object.assign(window, {
  AppShell,
  ExploreScreen,
  TripsScreen,
  CheckoutScreen,
  ConfirmationScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking_app/AppScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/Cards.jsx
try { (() => {
// Property card and listing grid

const PROPERTIES = [{
  id: 1,
  name: 'The Redwood A-Frame',
  loc: 'Olympic Peninsula, WA',
  guests: 2,
  price: 248,
  rating: 4.92,
  reviews: 128,
  gem: true,
  img: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=900&auto=format'
}, {
  id: 2,
  name: 'Desert Glass House',
  loc: 'Joshua Tree, CA',
  guests: 4,
  price: 412,
  rating: 4.88,
  reviews: 203,
  gem: false,
  img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&auto=format'
}, {
  id: 3,
  name: 'Cove Fisherman\u2019s Cabin',
  loc: 'Deer Isle, ME',
  guests: 3,
  price: 186,
  rating: 4.95,
  reviews: 74,
  gem: true,
  img: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&auto=format'
}, {
  id: 4,
  name: 'The Wildflower Barn',
  loc: 'Hudson Valley, NY',
  guests: 6,
  price: 324,
  rating: 4.81,
  reviews: 156,
  gem: false,
  img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&auto=format'
}, {
  id: 5,
  name: 'Black Rock A-Frame',
  loc: 'Big Sur, CA',
  guests: 2,
  price: 375,
  rating: 4.97,
  reviews: 91,
  gem: true,
  img: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=900&auto=format'
}, {
  id: 6,
  name: 'The Switchback Cabin',
  loc: 'Asheville, NC',
  guests: 4,
  price: 215,
  rating: 4.86,
  reviews: 112,
  gem: false,
  img: 'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=900&auto=format'
}];
const PropertyCard = ({
  p,
  onOpen
}) => {
  const [saved, setSaved] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onOpen && onOpen(p),
    className: "hg-prop-card",
    style: {
      background: 'var(--bg-surface)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'box-shadow 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      aspectRatio: '4 / 3',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      background: `url(${p.img}) center/cover`,
      transition: 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    },
    className: "hg-prop-img"
  }), p.gem && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    variant: "gem"
  }, "\u2756 Hidden Gem")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      right: 12
    }
  }, /*#__PURE__*/React.createElement(HeartButton, {
    saved: saved,
    onClick: e => {
      e.stopPropagation();
      setSaved(!saved);
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 17,
      fontWeight: 500,
      color: 'var(--forest-900)',
      letterSpacing: '-0.01em'
    }
  }, p.name), /*#__PURE__*/React.createElement(Rating, {
    value: p.rating
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 13,
      color: 'var(--fg-tertiary)'
    }
  }, p.loc, " \xB7 ", p.guests, " guests"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 14,
      color: 'var(--forest-900)',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "$", p.price), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-tertiary)'
    }
  }, "/ night"))));
};
const CategoryBar = ({
  active,
  onSet
}) => {
  const cats = [{
    id: 'all',
    label: 'All',
    icon: 'compass'
  }, {
    id: 'cabins',
    label: 'Cabins',
    icon: 'building'
  }, {
    id: 'aframes',
    label: 'A-frames',
    icon: 'home'
  }, {
    id: 'coastal',
    label: 'Coastal',
    icon: 'umbrella'
  }, {
    id: 'desert',
    label: 'Desert',
    icon: 'compass'
  }, {
    id: 'offgrid',
    label: 'Off-grid',
    icon: 'map'
  }, {
    id: 'parks',
    label: 'National Parks',
    icon: 'marker-pin'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      overflowX: 'auto',
      padding: '4px 0'
    }
  }, cats.map(c => {
    const isActive = active === c.id;
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      onClick: () => onSet(c.id),
      style: {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '10px 16px',
        minWidth: 86,
        flex: 'none',
        background: isActive ? 'var(--forest-700)' : 'var(--bg-surface)',
        color: isActive ? 'var(--sand-25)' : 'var(--forest-900)',
        border: '1px solid ' + (isActive ? 'var(--forest-700)' : 'var(--border-subtle)'),
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: c.icon,
      size: 20,
      color: isActive ? 'var(--sand-25)' : undefined
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 500
      }
    }, c.label));
  }));
};
Object.assign(window, {
  PROPERTIES,
  PropertyCard,
  CategoryBar
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/Cards.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/Chrome.jsx
try { (() => {
// Header nav, footer, search bar

const Header = ({
  scrolled,
  onNavigate,
  current
}) => /*#__PURE__*/React.createElement("header", {
  style: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: scrolled ? 'rgba(251,249,245,0.82)' : 'transparent',
    backdropFilter: scrolled ? 'blur(14px)' : 'none',
    borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
    transition: 'all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '18px 64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
}, /*#__PURE__*/React.createElement("div", {
  onClick: () => onNavigate('home'),
  style: {
    cursor: 'pointer'
  }
}, /*#__PURE__*/React.createElement(Logo, null)), /*#__PURE__*/React.createElement("nav", {
  style: {
    display: 'flex',
    gap: 30
  }
}, [{
  id: 'stays',
  label: 'Stays'
}, {
  id: 'guides',
  label: 'Guides'
}, {
  id: 'experiences',
  label: 'Experiences'
}, {
  id: 'host',
  label: 'Become a host'
}].map(item => /*#__PURE__*/React.createElement("a", {
  key: item.id,
  onClick: () => onNavigate(item.id),
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 500,
    color: current === item.id ? 'var(--forest-900)' : 'var(--fg-secondary)',
    cursor: 'pointer',
    textDecoration: 'none',
    borderBottom: current === item.id ? '1.5px solid var(--gold-300)' : '1.5px solid transparent',
    paddingBottom: 2,
    transition: 'all 150ms'
  }
}, item.label))), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }
}, /*#__PURE__*/React.createElement(Button, {
  variant: "tertiary",
  size: "sm"
}, "Sign in"), /*#__PURE__*/React.createElement(Button, {
  variant: "primary",
  size: "sm"
}, "Start a trip"))));
const SearchBar = ({
  floating = false
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--bg-surface)',
    borderRadius: 999,
    boxShadow: floating ? 'var(--shadow-float)' : 'var(--shadow-md)',
    border: '1px solid var(--border-subtle)',
    padding: 6
  }
}, [{
  l: 'Where',
  v: 'Anywhere in the US'
}, {
  l: 'Check in',
  v: 'Add dates'
}, {
  l: 'Check out',
  v: 'Add dates'
}, {
  l: 'Guests',
  v: 'Who\u2019s coming'
}].map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
  key: i
}, i > 0 && /*#__PURE__*/React.createElement("span", {
  style: {
    width: 1,
    height: 30,
    background: 'var(--border-subtle)'
  }
}), /*#__PURE__*/React.createElement("div", {
  style: {
    padding: '10px 22px',
    borderRadius: 999,
    cursor: 'pointer',
    minWidth: 150
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--forest-900)',
    marginBottom: 2
  }
}, s.l), /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    color: 'var(--fg-tertiary)'
  }
}, s.v)))), /*#__PURE__*/React.createElement("button", {
  style: {
    width: 48,
    height: 48,
    borderRadius: 999,
    background: 'var(--forest-500)',
    border: 'none',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: 4
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: "search",
  size: 20,
  color: "var(--sand-25)"
})));
const Footer = () => /*#__PURE__*/React.createElement("footer", {
  style: {
    background: 'var(--forest-800)',
    color: 'var(--sand-100)',
    padding: '72px 64px 40px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    maxWidth: 1280,
    margin: '0 auto'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
    gap: 48
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logo, {
  invert: true
}), /*#__PURE__*/React.createElement("p", {
  style: {
    marginTop: 20,
    color: 'var(--sand-200)',
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 300
  }
}, "A curated boutique travel platform. Every stay verified by a local friend.")), [{
  title: 'Discover',
  links: ['Stays', 'Guides', 'Experiences', 'Gift cards']
}, {
  title: 'Hosting',
  links: ['Host your home', 'Hosting resources', 'Community', 'Referrals']
}, {
  title: 'About',
  links: ['Our story', 'Press', 'Careers', 'Contact']
}].map(col => /*#__PURE__*/React.createElement("div", {
  key: col.title
}, /*#__PURE__*/React.createElement("div", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--gold-300)',
    marginBottom: 18
  }
}, col.title), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }
}, col.links.map(l => /*#__PURE__*/React.createElement("a", {
  key: l,
  style: {
    color: 'var(--sand-100)',
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer'
  }
}, l)))))), /*#__PURE__*/React.createElement("div", {
  style: {
    marginTop: 64,
    paddingTop: 28,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--sand-300)',
    fontSize: 13
  }
}, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 HiddenGem Stays"), /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'flex',
    gap: 24
  }
}, /*#__PURE__*/React.createElement("a", {
  style: {
    color: 'inherit'
  }
}, "Terms"), /*#__PURE__*/React.createElement("a", {
  style: {
    color: 'inherit'
  }
}, "Privacy"), /*#__PURE__*/React.createElement("a", {
  style: {
    color: 'inherit'
  }
}, "Cookies")))));
Object.assign(window, {
  Header,
  SearchBar,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/Pages.jsx
try { (() => {
// Pages for the marketing site

const HomePage = ({
  onNavigate
}) => {
  const [category, setCategory] = React.useState('all');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      height: 680,
      overflow: 'hidden',
      borderRadius: '0 0 20px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=2000&auto=format) center/cover'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(20,26,17,0.25) 0%, rgba(20,26,17,0.05) 40%, rgba(20,26,17,0.55) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1280,
      margin: '0 auto',
      padding: '120px 64px',
      color: 'var(--sand-25)'
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--gold-300)"
  }, "For the ones who wander"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 88,
      fontWeight: 400,
      letterSpacing: '-0.015em',
      lineHeight: 1.02,
      margin: '18px 0 20px',
      maxWidth: 820
    }
  }, "Find your ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: 'italic',
      fontWeight: 400
    }
  }, "hidden gem"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-body)',
      fontSize: 20,
      lineHeight: 1.5,
      color: 'var(--sand-100)',
      maxWidth: 560,
      marginBottom: 48
    }
  }, "A curated boutique platform for stays you won't find on the other apps \u2014 cabins, A-frames, coastal hideouts. Each one verified by a local friend.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -32,
      left: '50%',
      transform: 'translateX(-50%)'
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    floating: true
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1280,
      margin: '72px auto 40px',
      padding: '0 64px'
    }
  }, /*#__PURE__*/React.createElement(CategoryBar, {
    active: category,
    onSet: setCategory
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      padding: '0 64px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "Featured this week"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 44,
      fontWeight: 400,
      letterSpacing: '-0.012em',
      marginTop: 8
    }
  }, "Stays, chosen by hand.")), /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    iconRight: "arrow-right"
  }, "See all 142")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, PROPERTIES.map(p => /*#__PURE__*/React.createElement(PropertyCard, {
    key: p.id,
    p: p,
    onOpen: p => onNavigate('detail', p)
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--forest-700)',
      color: 'var(--sand-25)',
      padding: '96px 64px',
      borderRadius: 20,
      margin: '0 24px 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 80,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    color: "var(--gold-300)"
  }, "A guide from us"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 56,
      fontWeight: 400,
      letterSpacing: '-0.015em',
      lineHeight: 1.05,
      margin: '18px 0 24px'
    }
  }, "Three stays for the first cool night of ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontStyle: 'italic'
    }
  }, "autumn"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: 1.6,
      color: 'var(--sand-200)',
      maxWidth: 480,
      marginBottom: 32
    }
  }, "A shortlist from our editors \u2014 each one quiet, high, and reachable only by a gravel switchback. Worth every kilometer."), /*#__PURE__*/React.createElement(Button, {
    variant: "gold",
    size: "lg",
    iconRight: "arrow-right"
  }, "Read the guide")), /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '4/5',
      borderRadius: 16,
      overflow: 'hidden',
      background: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&auto=format) center/cover'
    }
  }))));
};
const ListingPage = ({
  onNavigate
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
  style: {
    maxWidth: 1280,
    margin: '32px auto 0',
    padding: '0 64px'
  }
}, /*#__PURE__*/React.createElement(SearchBar, null)), /*#__PURE__*/React.createElement("section", {
  style: {
    maxWidth: 1280,
    margin: '32px auto',
    padding: '0 64px'
  }
}, /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 24
  }
}, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, null, "142 stays"), /*#__PURE__*/React.createElement("h1", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 42,
    fontWeight: 400,
    letterSpacing: '-0.012em',
    marginTop: 6
  }
}, "Cabins in the Pacific Northwest")), /*#__PURE__*/React.createElement(Button, {
  variant: "secondary",
  icon: "filter"
}, "Filters")), /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24
  }
}, PROPERTIES.concat(PROPERTIES).slice(0, 9).map((p, i) => /*#__PURE__*/React.createElement(PropertyCard, {
  key: i,
  p: p,
  onOpen: () => onNavigate('detail', p)
})))));
const DetailPage = ({
  property = PROPERTIES[0],
  onNavigate
}) => {
  const p = property;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '24px auto 80px',
      padding: '0 64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
      fontSize: 13,
      color: 'var(--fg-tertiary)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: () => onNavigate('home'),
    style: {
      cursor: 'pointer',
      color: 'var(--forest-700)'
    }
  }, "Home"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("a", {
    onClick: () => onNavigate('stays'),
    style: {
      cursor: 'pointer',
      color: 'var(--forest-700)'
    }
  }, "Cabins"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, p.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, p.gem && /*#__PURE__*/React.createElement(Badge, {
    variant: "gem"
  }, "\u2756 Hidden Gem"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 54,
      fontWeight: 400,
      letterSpacing: '-0.012em',
      marginTop: 10
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      color: 'var(--fg-secondary)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: p.rating,
    count: p.reviews
  }), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.loc), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.guests, " guests"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    icon: "share"
  }, "Share"), /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    icon: "heart"
  }, "Save"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 8,
      borderRadius: 20,
      overflow: 'hidden',
      aspectRatio: '2.2 / 1',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridRow: '1 / 3',
      background: `url(${p.img}) center/cover`
    }
  }), [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: `url(https://images.unsplash.com/photo-${['1449844908441-8829872d2607', '1520250497591-112f2f40a3f4', '1542718610-a1d656d1884c', '1464146072230-91cabc968266'][i]}?w=600&auto=format) center/cover`
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: 80
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      paddingBottom: 28,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 999,
      background: 'url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format) center/cover'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 18,
      fontWeight: 500,
      color: 'var(--forest-900)'
    }
  }, "Hosted by Mara"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-tertiary)'
    }
  }, "Superhost \xB7 6 years \xB7 312 reviews"))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 28,
      paddingBottom: 28,
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 500,
      marginBottom: 12
    }
  }, "About this stay"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--fg-secondary)',
      maxWidth: 620
    }
  }, "Quiet, high, and reachable only by a gravel switchback. The A-frame sits on the edge of old-growth redwoods, with a wood stove, a clawfoot tub on the deck, and a south-facing window that catches the last hour of sun. Worth every kilometer.")), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 28
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 500,
      marginBottom: 18
    }
  }, "What this stay has"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 14
    }
  }, [['wifi', 'Fast Wi-Fi'], ['umbrella', 'Private deck'], ['building', 'Wood stove'], ['compass', 'Trailhead at door'], ['camera', 'Dark-sky viewing'], ['message', '24h host chat']].map(([ic, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      fontSize: 15,
      color: 'var(--forest-900)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20,
    style: {
      color: 'var(--forest-700)'
    }
  }), l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      top: 100,
      alignSelf: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--bg-surface)',
      borderRadius: 16,
      boxShadow: 'var(--shadow-lg)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 26,
      fontWeight: 600,
      color: 'var(--forest-900)'
    }
  }, "$", p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--fg-tertiary)',
      fontSize: 14
    }
  }, "/ night")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 10
    }
  }, [['Check in', 'Thu, Apr 24'], ['Check out', 'Sun, Apr 27']].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      padding: '10px 14px',
      borderLeft: i ? '1px solid var(--border-default)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--forest-900)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 4
    }
  }, l), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-secondary)'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 600,
      color: 'var(--forest-900)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 4
    }
  }, "Guests"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-secondary)'
    }
  }, "2 guests")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    style: {
      width: '100%',
      justifyContent: 'center'
    }
  }, "Reserve"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: '1px solid var(--border-subtle)',
      fontSize: 13,
      color: 'var(--fg-secondary)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "$", p.price, " \xD7 3 nights"), /*#__PURE__*/React.createElement("span", null, "$", p.price * 3)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Cleaning fee"), /*#__PURE__*/React.createElement("span", null, "$60")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontWeight: 600,
      fontSize: 15,
      color: 'var(--forest-900)',
      paddingTop: 10,
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", null, "$", p.price * 3 + 60)))))));
};
Object.assign(window, {
  HomePage,
  ListingPage,
  DetailPage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/Pages.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing_site/Primitives.jsx
try { (() => {
// Shared UI primitives for HiddenGem marketing site
// Components attach to window for sharing across Babel scripts.

const Icon = ({
  name,
  size = 20,
  color,
  style = {}
}) => {
  const svg = window.ICONS && window.ICONS[name] || '';
  return /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-hidden": "true",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      verticalAlign: 'middle',
      color: color || 'currentColor',
      flex: 'none',
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
    }
  });
};
const Diamond = ({
  size = 28,
  bg = 'var(--forest-500)',
  fg = 'var(--gold-300)'
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size,
    height: size,
    background: bg,
    color: fg,
    borderRadius: size * 0.26,
    fontFamily: 'var(--font-display)',
    fontSize: size * 0.6,
    lineHeight: 1,
    fontWeight: 400
  }
}, "\u2756");
const Logo = ({
  invert = false
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: 'flex',
    alignItems: 'center',
    gap: 10
  }
}, /*#__PURE__*/React.createElement(Diamond, {
  bg: invert ? 'var(--gold-300)' : 'var(--forest-500)',
  fg: invert ? 'var(--forest-700)' : 'var(--gold-300)'
}), /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: invert ? 'var(--sand-25)' : 'var(--forest-900)'
  }
}, /*#__PURE__*/React.createElement("b", {
  style: {
    fontWeight: 600
  }
}, "HiddenGem"), " Stays"));
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconRight,
  onClick,
  style = {}
}) => {
  const sizes = {
    sm: {
      padding: '8px 14px',
      fontSize: 13,
      radius: 8
    },
    md: {
      padding: '10px 18px',
      fontSize: 14,
      radius: 8
    },
    lg: {
      padding: '14px 24px',
      fontSize: 15,
      radius: 10
    },
    xl: {
      padding: '16px 28px',
      fontSize: 16,
      radius: 12
    }
  };
  const variants = {
    primary: {
      background: 'var(--forest-500)',
      color: 'var(--sand-25)',
      border: 'none'
    },
    secondary: {
      background: 'var(--bg-surface)',
      color: 'var(--forest-700)',
      border: '1px solid var(--border-default)'
    },
    tertiary: {
      background: 'transparent',
      color: 'var(--forest-700)',
      border: 'none'
    },
    dark: {
      background: 'var(--forest-700)',
      color: 'var(--sand-25)',
      border: 'none'
    },
    gold: {
      background: 'var(--gold-300)',
      color: 'var(--gold-700)',
      border: 'none'
    }
  };
  const s = sizes[size];
  const v = variants[variant];
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    className: "hg-btn",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: s.padding,
      fontSize: s.fontSize,
      fontWeight: 500,
      fontFamily: 'var(--font-body)',
      borderRadius: s.radius,
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      ...v,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), children, iconRight && /*#__PURE__*/React.createElement(Icon, {
    name: iconRight,
    size: 16
  }));
};
const Badge = ({
  variant = 'neutral',
  children,
  icon
}) => {
  const variants = {
    gem: {
      background: 'var(--gold-50)',
      color: 'var(--gold-700)',
      boxShadow: 'inset 0 0 0 1px var(--gold-200)'
    },
    verified: {
      background: 'var(--forest-50)',
      color: 'var(--forest-700)',
      boxShadow: 'inset 0 0 0 1px var(--forest-100)'
    },
    neutral: {
      background: 'var(--sand-50)',
      color: 'var(--forest-700)'
    },
    dark: {
      background: 'var(--forest-700)',
      color: 'var(--sand-25)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 10px',
      borderRadius: 999,
      fontFamily: 'var(--font-body)',
      fontSize: 12,
      fontWeight: 500,
      ...variants[variant]
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 12
  }), children);
};
const Eyebrow = ({
  children,
  color = 'var(--gold-400)'
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color
  }
}, children);
const HeartButton = ({
  saved,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  style: {
    width: 36,
    height: 36,
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    color: saved ? '#c43b2e' : 'var(--forest-900)'
  }
}, /*#__PURE__*/React.createElement(Icon, {
  name: saved ? 'heart-filled' : 'heart',
  size: 16
}));
const Rating = ({
  value,
  count,
  size = 13
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: size,
    color: 'var(--forest-900)'
  }
}, /*#__PURE__*/React.createElement("span", {
  style: {
    color: 'var(--gold-400)',
    fontSize: size
  }
}, "\u2605"), value, count != null && /*#__PURE__*/React.createElement("span", {
  style: {
    color: 'var(--fg-tertiary)',
    fontWeight: 400
  }
}, " \xB7 ", count));
Object.assign(window, {
  Icon,
  Diamond,
  Logo,
  Button,
  Badge,
  Eyebrow,
  HeartButton,
  Rating
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing_site/Primitives.jsx", error: String((e && e.message) || e) }); }

})();
