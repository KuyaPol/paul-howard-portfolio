const aboutCard = document.querySelector('.about-interactive');

if (aboutCard) {
  const profilePanel = aboutCard.closest('.profile-panel');
  const aboutBack = aboutCard.querySelector('.profile-about-back');
  const toggleAboutCard = () => {
    const isOpen = aboutCard.dataset.open === 'true';
    const nextOpen = !isOpen;
    aboutCard.dataset.open = String(nextOpen);
    profilePanel.dataset.open = String(nextOpen);
    aboutCard.setAttribute('aria-expanded', String(nextOpen));
    aboutCard.setAttribute(
      'aria-label',
      nextOpen
        ? 'Profile code card. About Me information revealed. Activate to return.'
        : 'Profile code card. Activate to reveal About Me information.'
    );
    aboutBack.setAttribute('aria-hidden', String(!nextOpen));
    aboutBack.inert = !nextOpen;
  };

  aboutCard.addEventListener('click', toggleAboutCard);
  aboutCard.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) toggleAboutCard();
    }
  });
}
