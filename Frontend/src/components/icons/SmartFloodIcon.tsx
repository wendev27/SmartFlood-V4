import type { SVGProps } from "react";

export type SmartFloodIconName =
  | "accountCheck"
  | "accountUpdated"
  | "alertLevel"
  | "alertLevelUpdate"
  | "approved"
  | "auditLogs"
  | "cube"
  | "dashboard"
  | "floodHeatmap"
  | "floodHistory"
  | "floodRiskDistribution"
  | "hardware"
  | "loginFailed"
  | "loginSuccess"
  | "pendingReview"
  | "rejected"
  | "resident"
  | "residentAdded"
  | "sensorConfiguration"
  | "systemLogs"
  | "waterLevelTrends";

interface SmartFloodIconProps extends SVGProps<SVGSVGElement> {
  name: SmartFloodIconName;
  size?: 20 | 32 | 40;
}

export function SmartFloodIcon({ name, size = 32, ...props }: SmartFloodIconProps) {
  const iconProps = {
    width: size,
    height: size,
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
    focusable: false,
    ...props,
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M12 29.3334V16.0001H20V29.3334M4 12.0001L16 2.66675L28 12.0001V26.6667C28 27.374 27.719 28.0523 27.219 28.5524C26.7189 29.0525 26.0406 29.3334 25.3333 29.3334H6.66667C5.95942 29.3334 5.28115 29.0525 4.78105 28.5524C4.28095 28.0523 4 27.374 4 26.6667V12.0001Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "hardware":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M10.6666 28H21.3333M16 22.6667V28M5.33329 4H26.6666C28.1394 4 29.3333 5.19391 29.3333 6.66667V20C29.3333 21.4728 28.1394 22.6667 26.6666 22.6667H5.33329C3.86053 22.6667 2.66663 21.4728 2.66663 20V6.66667C2.66663 5.19391 3.86053 4 5.33329 4Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "auditLogs":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M29.3333 25.3333C29.3333 26.0406 29.0523 26.7189 28.5522 27.219C28.0521 27.719 27.3739 28 26.6666 28H5.33329C4.62605 28 3.94777 27.719 3.44767 27.219C2.94758 26.7189 2.66663 26.0406 2.66663 25.3333V6.66667C2.66663 5.95942 2.94758 5.28115 3.44767 4.78105C3.94777 4.28095 4.62605 4 5.33329 4H12L14.6666 8H26.6666C27.3739 8 28.0521 8.28095 28.5522 8.78105C29.0523 9.28115 29.3333 9.95942 29.3333 10.6667V25.3333Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "systemLogs":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M18.6667 2.66663H8C7.29276 2.66663 6.61448 2.94758 6.11438 3.44767C5.61428 3.94777 5.33334 4.62605 5.33334 5.33329V26.6666C5.33334 27.3739 5.61428 28.0521 6.11438 28.5522C6.61448 29.0523 7.29276 29.3333 8 29.3333H24C24.7073 29.3333 25.3855 29.0523 25.8856 28.5522C26.3857 28.0521 26.6667 27.3739 26.6667 26.6666V10.6666L18.6667 2.66663Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.6667 2.66663V10.6666H26.6667" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21.3333 17.3334H10.6667M21.3333 22.6667H10.6667M13.3333 12H10.6667" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "floodHeatmap":
      return (
        <svg {...iconProps} viewBox="0 0 40 40">
          <path d="M11.6667 27.1667C15.3333 27.1667 18.3333 24.1167 18.3333 20.4167C18.3333 18.4834 17.3833 16.65 15.4833 15.1C13.5833 13.55 12.15 11.25 11.6667 8.83337C11.1833 11.25 9.76667 13.5667 7.85 15.1C5.93333 16.6334 5 18.5 5 20.4167C5 24.1167 8 27.1667 11.6667 27.1667Z" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20.9332 11C22.0795 9.16853 22.8921 7.1484 23.3332 5.03333C24.1666 9.19999 26.6666 13.2 29.9999 15.8667C33.3332 18.5333 34.9999 21.7 34.9999 25.0333C35.0094 27.3371 34.3347 29.5919 33.0612 31.5118C31.7878 33.4317 29.9729 34.9302 27.8468 35.8175C25.7206 36.7047 23.3789 36.9407 21.1185 36.4955C18.8581 36.0502 16.7808 34.9439 15.1499 33.3167" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "cube":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M14.6667 28.9734C15.0721 29.2074 15.5319 29.3306 16 29.3306C16.4681 29.3306 16.9279 29.2074 17.3333 28.9734L26.6667 23.64C27.0717 23.4062 27.408 23.07 27.6421 22.6651C27.8761 22.2603 27.9995 21.801 28 21.3334V10.6667C27.9995 10.1991 27.8761 9.73978 27.6421 9.33492C27.408 8.93005 27.0717 8.59385 26.6667 8.36003L17.3333 3.0267C16.9279 2.79265 16.4681 2.66943 16 2.66943C15.5319 2.66943 15.0721 2.79265 14.6667 3.0267L5.33333 8.36003C4.92835 8.59385 4.59197 8.93005 4.35795 9.33492C4.12392 9.73978 4.00048 10.1991 4 10.6667V21.3334C4.00048 21.801 4.12392 22.2603 4.35795 22.6651C4.59197 23.07 4.92835 23.4062 5.33333 23.64L14.6667 28.9734Z" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 29.3333V16" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.38672 9.33337L16.0001 16L27.6134 9.33337" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5.69336L22 12.56" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "resident":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M21.3333 28V25.3333C21.3333 23.9188 20.7714 22.5623 19.7712 21.5621C18.771 20.5619 17.4144 20 16 20H7.99996C6.58547 20 5.22892 20.5619 4.22872 21.5621C3.22853 22.5623 2.66663 23.9188 2.66663 25.3333V28" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14.6667C14.9455 14.6667 17.3333 12.2789 17.3333 9.33333C17.3333 6.38781 14.9455 4 12 4C9.05444 4 6.66663 6.38781 6.66663 9.33333C6.66663 12.2789 9.05444 14.6667 12 14.6667Z" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M29.3334 28V25.3333C29.3325 24.1516 28.9392 23.0037 28.2152 22.0698C27.4912 21.1358 26.4775 20.4688 25.3334 20.1733" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21.3334 4.17334C22.4806 4.46707 23.4974 5.13427 24.2236 6.06975C24.9497 7.00523 25.3438 8.15578 25.3438 9.34001C25.3438 10.5242 24.9497 11.6748 24.2236 12.6103C23.4974 13.5457 22.4806 14.2129 21.3334 14.5067" stroke="white" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "accountCheck":
      return (
        <svg {...iconProps} viewBox="0 0 32 32">
          <path d="M29.068 13.3333C29.6769 16.3217 29.243 19.4285 27.8385 22.1357C26.434 24.8429 24.1439 26.9867 21.35 28.2097C18.5562 29.4328 15.4275 29.661 12.4857 28.8565C9.54397 28.0519 6.96693 26.2632 5.18438 23.7885C3.40183 21.3139 2.52151 18.303 2.69023 15.2578C2.85895 12.2127 4.06652 9.31744 6.11154 7.05488C8.15657 4.79232 10.9155 3.29923 13.9281 2.82459C16.9407 2.34995 20.0251 2.92247 22.6667 4.44665" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14.6667L16 18.6667L29.3333 5.33337" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "loginSuccess":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M12.5 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H12.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.33325 14.1667L12.4999 10L8.33325 5.83337" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 10H2.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "residentAdded":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M10.0001 18.3333C14.6025 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6025 1.66663 10.0001 1.66663C5.39771 1.66663 1.66675 5.39759 1.66675 9.99996C1.66675 14.6023 5.39771 18.3333 10.0001 18.3333Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 10.8334C11.3807 10.8334 12.5 9.71409 12.5 8.33337C12.5 6.95266 11.3807 5.83337 10 5.83337C8.61929 5.83337 7.5 6.95266 7.5 8.33337C7.5 9.71409 8.61929 10.8334 10 10.8334Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.83325 17.2183V15.8333C5.83325 15.3913 6.00885 14.9673 6.32141 14.6548C6.63397 14.3422 7.05789 14.1666 7.49992 14.1666H12.4999C12.9419 14.1666 13.3659 14.3422 13.6784 14.6548C13.991 14.9673 14.1666 15.3913 14.1666 15.8333V17.2183" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "accountUpdated":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M13.3334 17.5V15.8333C13.3334 14.9493 12.9822 14.1014 12.3571 13.4763C11.732 12.8512 10.8841 12.5 10.0001 12.5H5.00008C4.11603 12.5 3.26818 12.8512 2.64306 13.4763C2.01794 14.1014 1.66675 14.9493 1.66675 15.8333V17.5" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.50008 9.16667C9.34103 9.16667 10.8334 7.67428 10.8334 5.83333C10.8334 3.99238 9.34103 2.5 7.50008 2.5C5.65913 2.5 4.16675 3.99238 4.16675 5.83333C4.16675 7.67428 5.65913 9.16667 7.50008 9.16667Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.3333 17.4999V15.8333C18.3327 15.0947 18.0869 14.3773 17.6344 13.7935C17.1819 13.2098 16.5484 12.7929 15.8333 12.6083" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.3333 2.60828C14.0503 2.79186 14.6858 3.20886 15.1396 3.79353C15.5935 4.37821 15.8398 5.0973 15.8398 5.83744C15.8398 6.57758 15.5935 7.29668 15.1396 7.88135C14.6858 8.46603 14.0503 8.88303 13.3333 9.06661" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sensorConfiguration":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M4.08325 15.9167C0.833252 12.6667 0.833252 7.33337 4.08325 4.08337" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 13.5C4.58333 11.5833 4.58333 8.41663 6.5 6.41663" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.99992 11.6667C10.9204 11.6667 11.6666 10.9205 11.6666 10C11.6666 9.07957 10.9204 8.33337 9.99992 8.33337C9.07944 8.33337 8.33325 9.07957 8.33325 10C8.33325 10.9205 9.07944 11.6667 9.99992 11.6667Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.5 6.5C15.4167 8.41667 15.4167 11.5833 13.5 13.5833" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.9167 4.08337C19.1667 7.33337 19.1667 12.5834 15.9167 15.8334" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "loginFailed":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M12.9167 6.25004L14.8334 8.16671C14.9892 8.3194 15.1986 8.40492 15.4167 8.40492C15.6349 8.40492 15.8443 8.3194 16.0001 8.16671L17.7501 6.41671C17.9028 6.26093 17.9883 6.0515 17.9883 5.83337C17.9883 5.61525 17.9028 5.40581 17.7501 5.25004L15.8334 3.33337" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17.5 1.66663L9.5 9.66663" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.25008 17.5C8.78139 17.5 10.8334 15.448 10.8334 12.9167C10.8334 10.3854 8.78139 8.33337 6.25008 8.33337C3.71878 8.33337 1.66675 10.3854 1.66675 12.9167C1.66675 15.448 3.71878 17.5 6.25008 17.5Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alertLevelUpdate":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M10.1833 1.66663H9.81667C9.37464 1.66663 8.95072 1.84222 8.63816 2.15478C8.3256 2.46734 8.15 2.89127 8.15 3.33329V3.48329C8.1497 3.77556 8.07255 4.06262 7.92628 4.31566C7.78002 4.5687 7.56978 4.77882 7.31667 4.92496L6.95834 5.13329C6.70497 5.27957 6.41756 5.35658 6.125 5.35658C5.83244 5.35658 5.54503 5.27957 5.29167 5.13329L5.16667 5.06663C4.78422 4.84601 4.32987 4.78616 3.90334 4.90022C3.47681 5.01427 3.11296 5.29291 2.89167 5.67496L2.70833 5.99163C2.48772 6.37407 2.42787 6.82843 2.54192 7.25496C2.65598 7.68149 2.93461 8.04533 3.31667 8.26663L3.44167 8.34996C3.69356 8.49538 3.90302 8.7042 4.04921 8.95565C4.1954 9.2071 4.27325 9.49244 4.275 9.78329V10.2083C4.27617 10.502 4.19971 10.7908 4.05337 11.0454C3.90703 11.3 3.69601 11.5115 3.44167 11.6583L3.31667 11.7333C2.93461 11.9546 2.65598 12.3184 2.54192 12.745C2.42787 13.1715 2.48772 13.6258 2.70833 14.0083L2.89167 14.325C3.11296 14.707 3.47681 14.9856 3.90334 15.0997C4.32987 15.2138 4.78422 15.1539 5.16667 14.9333L5.29167 14.8666C5.54503 14.7203 5.83244 14.6433 6.125 14.6433C6.41756 14.6433 6.70497 14.7203 6.95834 14.8666L7.31667 15.075C7.56978 15.2211 7.78002 15.4312 7.92628 15.6843C8.07255 15.9373 8.1497 16.2244 8.15 16.5166V16.6666C8.15 17.1087 8.3256 17.5326 8.63816 17.8451C8.95072 18.1577 9.37464 18.3333 9.81667 18.3333H10.1833C10.6254 18.3333 11.0493 18.1577 11.3618 17.8451C11.6744 17.5326 11.85 17.1087 11.85 16.6666V16.5166C11.8503 16.2244 11.9275 15.9373 12.0737 15.6843C12.22 15.4312 12.4302 15.2211 12.6833 15.075L13.0417 14.8666C13.295 14.7203 13.5824 14.6433 13.875 14.6433C14.1676 14.6433 14.455 14.7203 14.7083 14.8666L14.8333 14.9333C15.2158 15.1539 15.6701 15.2138 16.0967 15.0997C16.5232 14.9856 16.887 14.707 17.1083 14.325L17.2917 14C17.5123 13.6175 17.5721 13.1632 17.4581 12.7366C17.344 12.3101 17.0654 11.9463 16.6833 11.725L16.5583 11.6583C16.304 11.5115 16.093 11.3 15.9466 11.0454C15.8003 10.7908 15.7238 10.502 15.725 10.2083V9.79163C15.7238 9.49794 15.8003 9.20917 15.9466 8.95454C16.093 8.69991 16.304 8.48847 16.5583 8.34163L16.6833 8.26663C17.0654 8.04533 17.344 7.68149 17.4581 7.25496C17.5721 6.82843 17.5123 6.37407 17.2917 5.99163L17.1083 5.67496C16.887 5.29291 16.5232 5.01427 16.0967 4.90022C15.6701 4.78616 15.2158 4.84601 14.8333 5.06663L14.7083 5.13329C14.455 5.27957 14.1676 5.35658 13.875 5.35658C13.5824 5.35658 13.295 5.27957 13.0417 5.13329L12.6833 4.92496C12.4302 4.77882 12.22 4.5687 12.0737 4.31566C11.9275 4.06262 11.8503 3.77556 11.85 3.48329V3.33329C11.85 2.89127 11.6744 2.46734 11.3618 2.15478C11.0493 1.84222 10.6254 1.66663 10.1833 1.66663Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="white" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alertLevel":
      return (
        <svg {...iconProps} viewBox="0 0 40 40">
          <path d="M19.9998 15V21.6666M19.9998 28.3333H20.0165M17.1498 6.43331L3.03312 30C2.74207 30.504 2.58807 31.0755 2.58644 31.6575C2.58481 32.2395 2.73561 32.8119 3.02383 33.3175C3.31206 33.8232 3.72767 34.2446 4.2293 34.5397C4.73094 34.8349 5.30112 34.9936 5.88312 35H34.1165C34.6985 34.9936 35.2686 34.8349 35.7703 34.5397C36.2719 34.2446 36.6875 33.8232 36.9757 33.3175C37.264 32.8119 37.4148 32.2395 37.4131 31.6575C37.4115 31.0755 37.2575 30.504 36.9665 30L22.8498 6.43331C22.5527 5.94349 22.1343 5.53851 21.6351 5.25745C21.1359 4.97639 20.5727 4.82874 19.9998 4.82874C19.4269 4.82874 18.8637 4.97639 18.3645 5.25745C17.8653 5.53851 17.4469 5.94349 17.1498 6.43331Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "floodHistory":
      return (
        <svg {...iconProps} viewBox="0 0 40 40">
          <path d="M5 20C5 22.9667 5.87973 25.8668 7.52796 28.3336C9.17618 30.8003 11.5189 32.7229 14.2597 33.8582C17.0006 34.9935 20.0166 35.2906 22.9264 34.7118C25.8361 34.133 28.5088 32.7044 30.6066 30.6066C32.7044 28.5088 34.133 25.8361 34.7118 22.9264C35.2906 20.0166 34.9935 17.0006 33.8582 14.2597C32.7229 11.5189 30.8003 9.17618 28.3336 7.52796C25.8668 5.87973 22.9667 5 20 5C15.8066 5.01578 11.7816 6.65204 8.76667 9.56667L5 13.3333" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 5V13.3333H13.3333" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 11.6666V20L26.6667 23.3333" stroke="white" strokeWidth="3.33333" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "waterLevelTrends":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M2.5 2.5V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H17.5" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 14.1667V7.5" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.833 14.1667V4.16669" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.66699 14.1667V11.6667" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "floodRiskDistribution":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M18.3337 5.83331L11.2503 12.9166L7.08366 8.74998L1.66699 14.1666" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.333 5.83331H18.333V10.8333" stroke="#0057FF" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pendingReview":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M10.0003 18.3333C14.6027 18.3333 18.3337 14.6024 18.3337 10C18.3337 5.39763 14.6027 1.66667 10.0003 1.66667C5.39795 1.66667 1.66699 5.39763 1.66699 10C1.66699 14.6024 5.39795 18.3333 10.0003 18.3333Z" stroke="#155DFC" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5V10L13.3333 11.6667" stroke="#155DFC" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "approved":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M18.1669 8.33333C18.5474 10.2011 18.2762 12.1429 17.3984 13.8348C16.5206 15.5268 15.0893 16.8667 13.3431 17.6311C11.597 18.3955 9.64154 18.5382 7.80293 18.0353C5.96433 17.5325 4.35368 16.4145 3.23958 14.8678C2.12548 13.3212 1.57529 11.4394 1.68074 9.53615C1.78619 7.63294 2.54092 5.82341 3.81906 4.40931C5.0972 2.99521 6.8215 2.06202 8.7044 1.76538C10.5873 1.46873 12.515 1.82655 14.166 2.77917" stroke="#6A7282" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 9.16667L10 11.6667L18.3333 3.33333" stroke="#6A7282" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rejected":
      return (
        <svg {...iconProps} viewBox="0 0 20 20">
          <path d="M9.99935 18.3333C14.6017 18.3333 18.3327 14.6024 18.3327 10C18.3327 5.39763 14.6017 1.66667 9.99935 1.66667C5.39698 1.66667 1.66602 5.39763 1.66602 10C1.66602 14.6024 5.39698 18.3333 9.99935 18.3333Z" stroke="#6A7282" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 7.5L7.5 12.5" stroke="#6A7282" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 7.5L12.5 12.5" stroke="#6A7282" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
