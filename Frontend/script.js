const pageCopy = {
  dashboard: {
    title: "Welcome back!",
    subtitle: "Manage your barangay operations efficiently and effectively",
  },
  hardware: {
    title: "Sensor History",
    subtitle: "View and monitor sensor device readings",
  },
  logs: {
    title: "Account Management",
    subtitle: "Manage user accounts",
  },
  monitoring: {
    title: "Flood Monitoring Module",
    subtitle: "Track flood zones and live sensor readings across the barangay",
  },
  relief: {
    title: "AI-Optimized Relief Allocation",
    subtitle: "Prioritize relief distribution using current risk and telemetry data",
  },
  sensors: {
    title: "Sensor History",
    subtitle: "View and monitor sensor device readings",
  },
  residents: {
    title: "Resident Information",
    subtitle: "",
  },
  accounts: {
    title: "Verification",
    subtitle: "",
  },
};

const navLinks = document.querySelectorAll(".nav-link");
const panels = document.querySelectorAll(".page-panel");
const pageTitle = document.querySelector("#page-title");
const pageSubtitle = document.querySelector("#page-subtitle");
const profileName = document.querySelector(".profile-chip b");
const profileRole = document.querySelector(".profile-chip div span");
const profileAvatar = document.querySelector(".avatar");
const navCard = document.querySelector(".nav-card");
const mobileNavToggle = document.querySelector(".mobile-nav-toggle");
const accountTabs = document.querySelectorAll("[data-account-tab]");
const accountPanels = document.querySelectorAll("[data-account-panel]");
const reviewModal = document.querySelector("#review-modal");
const reviewOpenButtons = document.querySelectorAll("[data-review-open]");
const reviewCloseButtons = document.querySelectorAll("[data-review-close]");
const verificationTabs = document.querySelectorAll("[data-verification-tab]");
const verificationPanels = document.querySelectorAll("[data-verification-panel]");
const applicationModal = document.querySelector("#application-modal");
const applicationOpenButtons = document.querySelectorAll("[data-application-open]");
const applicationCloseButtons = document.querySelectorAll("[data-application-close]");
const applicationTitle = document.querySelector("#application-title");
const applicationAvatar = document.querySelector("#application-avatar");
const applicationFormInputs = document.querySelectorAll(".application-form input");
const applicationDefaultValues = Array.from(applicationFormInputs, (input) => input.value);
const applicationSaveButton = document.querySelector(".small-save");

function activatePage(page) {
  const selected = pageCopy[page] ? page : "dashboard";

  navLinks.forEach((link) => {
    const isActive = link.dataset.page === selected;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === selected);
  });

  pageTitle.textContent = pageCopy[selected].title;
  pageSubtitle.textContent = pageCopy[selected].subtitle;

  if (selected === "residents" || selected === "accounts") {
    profileName.textContent = "Barangay Official";
    profileRole.textContent = "Administrator";
    profileAvatar.textContent = "BO";
  } else {
    profileName.textContent = "NDRRMO Official";
    profileRole.textContent = "Disaster Response";
    profileAvatar.textContent = "NO";
  }
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const page = link.dataset.page;
    history.replaceState(null, "", `#${page}`);
    activatePage(page);
    navCard.classList.remove("open");
    mobileNavToggle.setAttribute("aria-expanded", "false");
  });
});

mobileNavToggle.addEventListener("click", () => {
  const isOpen = navCard.classList.toggle("open");
  mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
});

accountTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.accountTab;

    accountTabs.forEach((item) => {
      item.classList.toggle("active", item.dataset.accountTab === selected);
    });

    accountPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.accountPanel === selected);
    });
  });
});

reviewOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    reviewModal.classList.add("open");
    reviewModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });
});

reviewCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    reviewModal.classList.remove("open");
    reviewModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  });
});

reviewModal.addEventListener("click", (event) => {
  if (event.target === reviewModal) {
    reviewModal.classList.remove("open");
    reviewModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
});

verificationTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.verificationTab;

    verificationTabs.forEach((item) => {
      item.classList.toggle("active", item.dataset.verificationTab === selected);
    });

    verificationPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.verificationPanel === selected);
    });
  });
});

function openApplicationForm(mode) {
  const isAddMode = mode === "add";
  applicationTitle.textContent = isAddMode ? "Add Application" : "Edit Application";
  applicationAvatar.textContent = isAddMode ? "+" : "PG";
  applicationSaveButton.textContent = isAddMode ? "Add" : "Save";
  applicationModal.classList.toggle("add-mode", isAddMode);

  if (isAddMode) {
    applicationFormInputs.forEach((input) => {
      input.value = "";
    });
  } else {
    applicationFormInputs.forEach((input, index) => {
      input.value = applicationDefaultValues[index];
    });
  }

  applicationModal.classList.add("open");
  applicationModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeApplicationForm() {
  applicationModal.classList.remove("open");
  applicationModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

applicationOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openApplicationForm(button.dataset.applicationOpen);
  });
});

applicationCloseButtons.forEach((button) => {
  button.addEventListener("click", closeApplicationForm);
});

applicationModal.addEventListener("click", (event) => {
  if (event.target === applicationModal) {
    closeApplicationForm();
  }
});

activatePage(window.location.hash.replace("#", "") || "dashboard");
