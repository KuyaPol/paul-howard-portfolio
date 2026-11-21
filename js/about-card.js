const profilePanel = document.querySelector('.profile-panel.about-interactive');

if (profilePanel) {
  const frontFace = profilePanel.querySelector('.profile-panel-front');
  const backFace = profilePanel.querySelector('.profile-panel-back');

  const toggleProfilePanel = () => {
    const nextOpen = profilePanel.dataset.open !== 'true';
    profilePanel.dataset.open = String(nextOpen);
    profilePanel.setAttribute('aria-expanded', String(nextOpen));
    frontFace.setAttribute('aria-hidden', String(nextOpen));
    frontFace.inert = nextOpen;
    backFace.setAttribute('aria-hidden', String(!nextOpen));
    backFace.inert = !nextOpen;
  };

  profilePanel.addEventListener('click', toggleProfilePanel);
  profilePanel.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) toggleProfilePanel();
    }
  });
}
