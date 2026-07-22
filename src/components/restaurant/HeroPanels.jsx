import React, { useEffect } from 'react';

export default function HeroPanels() {
  useEffect(() => {
    var wrapper = document.getElementById('featuresWrapper');
    if (!wrapper) return;

    var items = Array.prototype.slice.call(wrapper.querySelectorAll('.features-service-item'));
    var figures = Array.prototype.slice.call(wrapper.querySelectorAll('.features-service-img'));

    function setActiveFigure(activeItem) {
      figures.forEach(function (fig) { fig.classList.remove('hover'); });
      var fig = activeItem.nextElementSibling;
      if (fig && fig.classList.contains('features-service-img')) {
        fig.classList.add('hover');
      }
    }

    items.forEach(function (item) {
      if (item.getAttribute('data-default') === 'yes') {
        setActiveFigure(item);
      }
      item.addEventListener('mouseenter', function () {
        setActiveFigure(item);
      });
    });

    function applyTitleOffsets() {
      var isDesktop = window.innerWidth > 1024;

      items.forEach(function (item) {
        var desc = item.querySelector('.features-service-desc');
        var title = item.querySelector('.features-service-title');
        if (!desc || !title) return;

        if (isDesktop) {
          var descHeight = desc.offsetHeight;
          title.style.transform = 'translateY(' + descHeight + 'px)';

          item.onmouseenter = function () {
            title.style.transform = 'translateY(0px)';
          };
          item.onmouseleave = function () {
            title.style.transform = 'translateY(' + descHeight + 'px)';
          };
        } else {
          title.style.transform = '';
          item.onmouseenter = null;
          item.onmouseleave = null;
        }
      });
    }

    window.addEventListener('load', applyTitleOffsets);
    window.addEventListener('resize', applyTitleOffsets);
    applyTitleOffsets();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
  :root {
    --dark: #0E1317;
    --panel-bg: #262832;
    --accent: #C19977;
    --white: #fff;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--dark);
    font-family: "Open Sans", sans-serif;
  }

  h4 {
    font-family: "Merriweather", serif;
    font-style: italic;
    font-weight: 700;
  }

  /* ================= WRAPPER ================= */
  .features-service-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
    display: flex;
    background: var(--panel-bg);
  }

  .features-service-item {
    height: 745px;
    position: relative;
    z-index: 2;
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    flex-basis: 0;
    flex-grow: 1;
  }
  .features-service-item:nth-last-child(2) {
    border-right: 0; /* last item (figure is truly last child) */
  }

  /* ================= BACKGROUND IMAGE LAYERS ================= */
  /* Each item is immediately followed by its own figure; all figures
     are stacked absolutely and only the one with .hover is shown. */
  .features-service-img {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 0;
    overflow: hidden;
    visibility: hidden;
    opacity: 0;
    margin: 0;
    transition: all 0.5s;
    background-size: cover;
    background-position: center;
  }
  .features-service-img.hover {
    opacity: 1;
    visibility: visible;
    transform: scale(1.05);
  }
  .features-service-img img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }

  /* Per-scene backgrounds are set via inline style on each figure.
     No CSS background rules here — keeping the longhand properties
     (background-size: cover, background-position: center) from the
     .features-service-img rule above, and letting the inline
     backgroundImage win without a shorthand reset. */

  /* ================= OVERLAY (blur) ================= */
  .features-service-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: -1;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s linear;
    backdrop-filter: blur(10px);
  }

  /* ================= CONTENT ================= */
  .features-service-content {
    font-family: "Merriweather", serif;
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: flex-end;
    padding: 50px;
    color: var(--white);
    position: relative;
  }

  .features-service-title {
    transition: transform 0.3s ease;
  }
  .features-service-title h4 {
    color: var(--white);
    margin: 0;
    font-weight: 600;
    font-size: 28px;
    line-height: 1.25;
  }
  .features-service-number {
    font-size: 20px;
    display: block;
    line-height: 1.2;
    margin-bottom: 16px;
    transition: color 0.3s linear;
  }

  .features-service-desc {
    overflow: hidden;
    font-family: "Open Sans", sans-serif;
  }
  .features-service-desc p {
    margin-top: 15px;
    margin-bottom: 0;
    font-size: 14.5px;
    line-height: 1.7;
  }

  .features-service-link {
    display: flex;
    justify-content: flex-start;
    margin-top: 24px;
  }

  /* ================= BUTTON ================= */
  .btn-details {
    position: relative;
    display: inline-block;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.5);
    min-width: 46px;
    height: 46px;
    font-size: 13px;
    text-transform: uppercase;
    color: #fff;
    overflow: hidden;
    padding-right: 20px;
    text-decoration: none;
    border-radius: var(--btn-radius);
    transition: all 0.3s linear;
  }
  .btn-details .btn-text {
    opacity: 0;
    text-indent: -81px;
    vertical-align: middle;
    position: relative;
    line-height: 45px;
    display: inline-block;
    font-weight: 600;
    transform: translateX(-23px);
    transition: opacity 0s cubic-bezier(.05,.43,.04,.87) 0s, text-indent .2s ease-in-out;
  }
  .btn-details i {
    margin: 0;
    line-height: 45px;
    position: absolute;
    left: 0; top: 0;
    width: 46px; height: 46px;
    text-align: center;
    font-style: normal;
    font-size: 16px;
  }
  .btn-details:hover {
    width: auto;
    background-color: var(--accent);
    border-color: var(--accent);
  }
  .btn-details:hover .btn-text {
    opacity: 1;
    text-indent: 45px;
    transform: translateX(0);
    transition: opacity .4s cubic-bezier(.05,.43,.04,.87) .2s, text-indent .2s ease-in-out, transform .1s .2s cubic-bezier(0,.84,.09,.97);
  }

  /* ================= HOVER STATES (desktop) ================= */
  @media (min-width: 1025px) {
    .features-service-desc {
      opacity: 0;
      visibility: hidden;
      transform: translateY(20%);
      transition: transform 0s .2s, opacity .2s;
    }
    .features-service-item:hover .features-service-desc {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
      transition: opacity .4s cubic-bezier(.33,.02,0,.93) .1s, transform .2s cubic-bezier(.645,.045,.355,1) .1s;
    }
    .features-service-item:hover .features-service-number {
      color: var(--accent);
    }
    .features-service-item:hover .features-service-overlay {
      visibility: visible;
      opacity: 1;
    }
  }

  /* ================= RESPONSIVE ================= */
  @media (max-width: 1024px) {
    .features-service-wrapper { display: block; }
    .features-service-item {
      display: block;
      width: 100%;
      height: 420px;
      border-right: none;
    }
    .features-service-item .features-service-overlay { display: none; }
    .features-service-img { display: none; }
    .features-service-item-mobile-bg {
      display: block;
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      z-index: -1;
    }
    .features-service-title { transform: none !important; }
    .features-service-desc {
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
    }
  }
` }} />

<div className="features-service-wrapper" id="featuresWrapper">

  <div className="features-service-item" data-default="yes">
    <div className="features-service-content">
      <div className="features-service-title">
        <span className="features-service-number">Ambiance chaleureuse et réconfortante</span>
        <h4>Une expérience de confort absolu</h4>
      </div>
      <div className="features-service-desc">
        <p>Plongez dans une atmosphère accueillante et apaisante, où chaque instant rime avec bien-être. Profitez d'un cadre chaleureux et d'un service attentionné pour des moments agréables et savoureux.</p>
      </div>
      <div className="features-service-link">
        <a href="#menu" className="btn-details">
          <i>&#8594;</i>
          <span className="btn-text">Voir notre menu</span>
        </a>
      </div>
      <div className="features-service-overlay"></div>
    </div>
    <div className="features-service-item-mobile-bg" data-scene="comfort" style={{ backgroundImage: "url('/NewHero/1.webp')" }}></div>
  </div>
  <figure className="features-service-img hover" data-scene="comfort" style={{ backgroundImage: "url('/NewHero/1.webp')" }}></figure>

  <div className="features-service-item">
    <div className="features-service-content">
      <div className="features-service-title">
        <span className="features-service-number">Divertissements en direct</span>
        <h4>Dîner avec des spectacles en direct</h4>
      </div>
      <div className="features-service-desc">
        <p>Venez savourer un dîner exceptionnel tout en profitant de spectacles en direct. Chaque soir, un live band anime l'ambiance pour une expérience culinaire unique où la gastronomie rencontre la musique et le divertissement.</p>
      </div>
      <div className="features-service-link">
        <a href="#menu" className="btn-details">
          <i>&#8594;</i>
          <span className="btn-text">Voir notre menu</span>
        </a>
      </div>
      <div className="features-service-overlay"></div>
    </div>
    <div className="features-service-item-mobile-bg" data-scene="live" style={{ backgroundImage: "url('/NewHero/2.webp')" }}></div>
  </div>
  <figure className="features-service-img" data-scene="live" style={{ backgroundImage: "url('/NewHero/2.webp')" }}></figure>

  <div className="features-service-item">
    <div className="features-service-content">
      <div className="features-service-title">
        <span className="features-service-number">Raffinement et saveurs</span>
        <h4>Expérience gastronomique d'exception</h4>
      </div>
      <div className="features-service-desc">
        <p>Dégustez des plats raffinés préparés avec des ingrédients de première qualité. Chaque assiette est une œuvre d'art culinaire, alliant saveurs authentiques et esthétisme raffiné.</p>
      </div>
      <div className="features-service-link">
        <a href="#menu" className="btn-details">
          <i>&#8594;</i>
          <span className="btn-text">Voir notre menu</span>
        </a>
      </div>
      <div className="features-service-overlay"></div>
    </div>
    <div className="features-service-item-mobile-bg" data-scene="gastronomy" style={{ backgroundImage: "url('/NewHero/3.webp')" }}></div>
  </div>
  <figure className="features-service-img" data-scene="gastronomy" style={{ backgroundImage: "url('/NewHero/3.webp')" }}></figure>

  <div className="features-service-item">
    <div className="features-service-content">
      <div className="features-service-title">
        <span className="features-service-number">L'art de la mixologie</span>
        <h4>Des cocktails d'exception</h4>
      </div>
      <div className="features-service-desc">
        <p>Dégustez des cocktails raffinés, élaborés avec des ingrédients de qualité et un savoir-faire unique. Une expérience sensorielle où chaque gorgée est un voyage.</p>
      </div>
      <div className="features-service-link">
        <a href="#menu" className="btn-details">
          <i>&#8594;</i>
          <span className="btn-text">Voir notre menu</span>
        </a>
      </div>
      <div className="features-service-overlay"></div>
    </div>
    <div className="features-service-item-mobile-bg" data-scene="cocktails" style={{ backgroundImage: "url('/NewHero/4.webp')" }}></div>
  </div>
  <figure className="features-service-img" data-scene="cocktails" style={{ backgroundImage: "url('/NewHero/4.webp')" }}></figure>

</div>
    </>
  );
}
