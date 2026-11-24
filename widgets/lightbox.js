/* guide page: tap a screenshot to see it large */
(function () {
  var lb = document.getElementById('lb'); if (!lb) return;
  var img = lb.querySelector('img');
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest && t.closest('.gallery img, .hero img')) { img.src = t.src; img.alt = t.alt; lb.classList.add('on'); return; }
    if (lb.classList.contains('on')) lb.classList.remove('on');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('on'); });
})();
