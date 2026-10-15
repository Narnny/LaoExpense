import React from 'react';
import { Transaction, Account, Category, User, Language } from '../types';
import { getT } from '../utils/translations';
import { playSound } from '../utils/audio';
import { exportAllUserDataToCSV, exportTransactionsToCSV, exportAccountsToCSV, exportCategoriesToCSV } from '../utils/formatters';
import { X, FileSpreadsheet, Download, Table, Check, Layers, Wallet, Tag } from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currentUser?: User | null;
  lang: Language;
  onSuccess?: (msg: string) => void;
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  categories,
  currentUser,
  lang,
  onSuccess,
}) => {
  const t = getT(lang);

  if (!isOpen) return null;

  const handleExportAll = () => {
    playSound('success');
    exportAllUserDataToCSV(transactions, accounts, categories, currentUser, lang);
    if (onSuccess) {
      onSuccess(lang === 'lo' ? 'ສົ່ງອອກຂໍ້ມູນທັງໝົດ (CSV Excel) ສຳເລັດແລ້ວ!' : 'All user data exported to CSV successfully!');
    }
    onClose();
  };

  const handleExportTransactions = () => {
    playSound('click');
    exportTransactionsToCSV(transactions, categories, accounts, lang);
    if (onSuccess) {
      onSuccess(lang === 'lo' ? 'ສົ່ງອອກລາຍການເຄື່ອນໄຫວ (CSV) ສຳເລັດແລ້ວ!' : 'Transactions exported to CSV!');
    }
  };

  const handleExportAccounts = () => {
    playSound('click');
    exportAccountsToCSV(accounts, transactions, lang);
    if (onSuccess) {
      onSuccess(lang === 'lo' ? 'ສົ່ງອອກບັນຊີ (CSV) ສຳເລັດແລ້ວ!' : 'Accounts exported to CSV!');
    }
  };

  const handleExportCategories = () => {
    playSound('click');
    exportCategoriesToCSV(categories, lang);
    if (onSuccess) {
      onSuccess(lang === 'lo' ? 'ສົ່ງອອກໝວດໝູ່ (CSV) ສຳເລັດແລ້ວ!' : 'Categories exported to CSV!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {lang === 'lo' ? 'ສົ່ງອອກຂໍ້ມູນສຳລັບ Excel (CSV)' : 'Export Data for Excel (CSV)'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'lo'
                  ? 'ດາວໂຫຼດຂໍ້ມູນລາຍຮັບ-ລາຍຈ່າຍໄປວິເຄາະໃນ Microsoft Excel ຫຼື Google Sheets'
                  : 'Download transactions, accounts, and categories to analyze in Excel'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Data Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center justify-center gap-1">
                <Table className="w-3 h-3 text-blue-400" />
                <span>{lang === 'lo' ? 'ລາຍການ' : 'Transactions'}</span>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono">
                {transactions.length.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center justify-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-400" />
                <span>{lang === 'lo' ? 'ບັນຊີ' : 'Accounts'}</span>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono">
                {accounts.length.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-400 font-medium mb-0.5 flex items-center justify-center gap-1">
                <Tag className="w-3 h-3 text-purple-400" />
                <span>{lang === 'lo' ? 'ໝວດໝູ່' : 'Categories'}</span>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono">
                {categories.length.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Primary Recommended Option: All User Data CSV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {lang === 'lo' ? 'ທາງເລືອກແນະນຳ (Recommended)' : 'Recommended'}
              </span>
              <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                {lang === 'lo' ? 'ຄົບທຸກຢ່າງ' : 'All In One'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportAll}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border-2 border-emerald-600/60 hover:border-emerald-500 hover:from-emerald-950 hover:to-slate-800 transition-all text-left group shadow-lg shadow-emerald-950/40 relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors">
                      {lang === 'lo'
                        ? 'ສົ່ງອອກຂໍ້ມູນທັງໝົດ (All User Data CSV)'
                        : 'Export All User Data (CSV for Excel)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-7">
                    {lang === 'lo'
                      ? 'ລວມທັງ ລາຍການເຄື່ອນໄຫວ, ບັນຊີ, ແລະ ໝວດໝູ່ທັງໝົດ ພ້ອມສະຫຼຸບຍອດ ໃນໄຟລ໌ CSV ດຽວ'
                      : 'Includes all transactions, accounts, and categories with live balances in a single CSV file'}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md">
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'lo' ? 'ດາວໂຫຼດ' : 'Download'}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Secondary Individual Tables for Power Excel Users */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {lang === 'lo' ? 'ຫຼື ດາວໂຫຼດແຍກສະເພາະຕາຕະລາງ (Individual Tables)' : 'Or Download Separate Tables'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'lo'
                ? 'ເໝາະສຳລັບການນຳເຂົ້າເຮັດ Pivot Table ຫຼື ສ້າງສູດຄິດໄລ່ສະເພາະໃນ Excel'
                : 'Ideal for Excel PivotTables and advanced database queries'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportTransactions}
                className="flex flex-col items-start p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <Table className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lang === 'lo' ? 'ລາຍການເຄື່ອນໄຫວ' : 'Transactions'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {transactions.length} {lang === 'lo' ? 'ລາຍການ' : 'rows'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportAccounts}
                className="flex flex-col items-start p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'lo' ? 'ບັນຊີ & ກະເປົາ' : 'Accounts'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {accounts.length} {lang === 'lo' ? 'ບັນຊີ' : 'accounts'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportCategories}
                className="flex flex-col items-start p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 mb-1">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>{lang === 'lo' ? 'ໝວດໝູ່' : 'Categories'}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {categories.length} {lang === 'lo' ? 'ໝວດໝູ່' : 'categories'}
                </span>
              </button>
            </div>
          </div>

          {/* UTF-8 / Excel Note */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === 'lo'
                ? 'ໄຟລ໌ CSV ບັນຈຸລະຫັດ UTF-8 with BOM ເຮັດໃຫ້ເປີດໃນ Microsoft Excel ສະແດງພາສາລາວ ແລະ ຕົວເລກຢ່າງຖືກຕ້ອງ 100% ໂດຍບໍ່ມີຕົວອັກສອນເພ້ຍ.'
                : 'CSV files include UTF-8 BOM encoding so Microsoft Excel and Google Sheets render Lao text and numbers flawlessly.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
};
