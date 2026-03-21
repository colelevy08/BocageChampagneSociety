/**
 * @file src/components/ui/ConfirmDialog.jsx
 * @description Styled confirmation dialog replacing browser's window.confirm.
 * Animated modal with customizable title, message, and button labels.
 * @importedBy src/pages/AdminInventory.jsx, Profile.jsx
 * @imports src/components/ui/Modal.jsx
 */

import Modal from './Modal';

/**
 * ConfirmDialog — styled confirmation popup with cancel/confirm actions.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {Function} props.onClose - Called when dialog should close (cancel)
 * @param {Function} props.onConfirm - Called when the user confirms
 * @param {string} props.title - Dialog heading
 * @param {string} props.message - Dialog body text
 * @param {string} props.confirmLabel - Confirm button text (default 'Confirm')
 * @param {string} props.cancelLabel - Cancel button text (default 'Cancel')
 * @param {boolean} props.destructive - If true, confirm button is red (default false)
 * @returns {JSX.Element}
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showClose={false}>
      {message && (
        <p className="font-serif text-sm text-noir-300 mb-6">{message}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-noir-700 text-noir-200 font-sans font-medium py-3 rounded-lg hover:bg-noir-600 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`flex-1 font-sans font-semibold py-3 rounded-lg transition-colors ${
            destructive
              ? 'bg-red-500/80 text-white hover:bg-red-500'
              : 'bg-champagne-500 text-noir-900 hover:bg-champagne-400'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
