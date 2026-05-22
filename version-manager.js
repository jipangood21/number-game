(function () {
  const versionWidget = document.getElementById("version-widget");
  const versionText = document.getElementById("version-text");
  const versionModal = document.getElementById("version-modal");
  const versionModalBackdrop = document.getElementById("version-modal-backdrop");
  const versionClose = document.getElementById("version-close");
  const versionList = document.getElementById("version-list");

  function init() {
    if (!CHANGELOG || CHANGELOG.length === 0) return;

    // 최신 버전 표시
    const latestVersion = CHANGELOG[0].version;
    versionText.textContent = t("version.label", { version: latestVersion });

    renderChangelog();

    versionWidget.addEventListener("click", () => {
      openModal();
    });

    versionModalBackdrop.addEventListener("click", () => {
      closeModal();
    });

    versionClose.addEventListener("click", () => {
      closeModal();
    });
  }

  function renderChangelog() {
    versionList.innerHTML = CHANGELOG.map(item => `
      <div class="version-item">
        <div class="version-header">
          <span class="version-num">v${item.version}</span>
          <span class="version-date">${item.date}</span>
        </div>
        <ul class="version-changes">
          ${item.changes.map(change => `<li>${change}</li>`).join("")}
        </ul>
      </div>
    `).join("");
  }

  function openModal() {
    versionModal.classList.add("active");
  }

  function closeModal() {
    versionModal.classList.remove("active");
  }

  // i18n 업데이트 시 텍스트 갱신을 위해 전역 함수로 노출하거나 
  // 기존 언어 변경 로직에 통합할 수 있도록 함
  window.updateVersionUI = function() {
    if (!CHANGELOG || CHANGELOG.length === 0) return;
    const latestVersion = CHANGELOG[0].version;
    versionText.textContent = t("version.label", { version: latestVersion });
    
    // 타이틀 및 닫기 버튼 번역 갱신
    const title = versionModal.querySelector(".version-modal-title");
    if (title) title.textContent = t("version.title");
    if (versionClose) versionClose.textContent = t("version.close");
  };

  // 초기화
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
