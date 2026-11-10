let currentExcelFileId = 'f_excel_1';
/**
 * EduOS - Excel Edu Module (Spreadsheet Grid & Safe Formula Engine)
 * Aplikasi pengolah angka dengan 30 baris x 15 kolom, SafeExcelParser, multi-sheet, dan visualisasi grafik SVG
 */

// 5. LOGIKA EXCEL EDU (Spreadsheet Grid & Safe Formula Engine)

    // Formula Parser Class (Safe, No eval)
    class SafeExcelParser {
      constructor(cellGetter) {
        this.getCellVal = cellGetter;
      }

      colNameToIndex(colStr) {
        let col = 0;
        const str = colStr.toUpperCase();
        for (let i = 0; i < str.length; i++) {
          col = col * 26 + (str.charCodeAt(i) - 64);
        }
        return col - 1;
      }

      indexToColName(idx) {
        let name = '';
        let num = idx + 1;
        while (num > 0) {
          const rem = (num - 1) % 26;
          name = String.fromCharCode(65 + rem) + name;
          num = Math.floor((num - 1) / 26);
        }
        return name || 'A';
      }

      parseCellRef(refStr) {
        const m = String(refStr).trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
        if (!m) return null;
        return {
          c: this.colNameToIndex(m[1]),
          r: parseInt(m[2], 10) - 1
        };
      }

      parseRange(rangeStr) {
        const parts = rangeStr.trim().toUpperCase().split(':');
        if (parts.length === 1) {
          const c = this.parseCellRef(parts[0]);
          return c ? { r1: c.r, r2: c.r, c1: c.c, c2: c.c } : null;
        }
        const c1 = this.parseCellRef(parts[0]);
        const c2 = this.parseCellRef(parts[1]);
        if (!c1 || !c2) return null;
        return {
          r1: Math.min(c1.r, c2.r),
          r2: Math.max(c1.r, c2.r),
          c1: Math.min(c1.c, c2.c),
          c2: Math.max(c1.c, c2.c)
        };
      }

      splitArgs(str) {
        const args = [];
        let current = '';
        let depth = 0;
        let inQuote = false;

        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '"' || char === "'") inQuote = !inQuote;
          if (!inQuote) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if ((char === ',' || char === ';') && depth === 0) {
              args.push(current.trim());
              current = '';
              continue;
            }
          }
          current += char;
        }
        if (current.trim().length > 0) args.push(current.trim());
        return args;
      }

      resolveRangeValues(argStr, visited) {
        const items = this.splitArgs(argStr);
        let values = [];
        for (const item of items) {
          const trimmed = item.trim();
          if (trimmed.includes(':')) {
            const rng = this.parseRange(trimmed);
            if (rng) {
              for (let r = rng.r1; r <= rng.r2; r++) {
                for (let c = rng.c1; c <= rng.c2; c++) {
                  const val = this.getCellVal(r, c, new Set(visited));
                  values.push(val);
                }
              }
            }
          } else {
            const cell = this.parseCellRef(trimmed);
            if (cell) {
              values.push(this.getCellVal(cell.r, cell.c, new Set(visited)));
            } else {
              const num = this.evaluateExpression(trimmed, visited);
              values.push(num);
            }
          }
        }
        return values;
      }

      evaluateExpression(expr, visited = new Set()) {
        expr = String(expr).trim();
        if (!expr) return '';

        // Strip leading '=' if present
        if (expr.startsWith('=')) {
          expr = expr.substring(1).trim();
        }

        // String literals: "LULUS" or 'LULUS'
        if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
          return expr.slice(1, -1);
        }

        const upper = expr.toUpperCase();

        // Handle IF function: IF(cond, valTrue, valFalse)
        if (upper.startsWith('IF(') && expr.endsWith(')')) {
          const inner = expr.slice(3, -1);
          const args = this.splitArgs(inner);
          if (args.length < 2) return '#ERROR!';
          const condVal = this.evaluateCondition(args[0], visited);
          if (condVal === true) {
            return this.evaluateExpression(args[1], visited);
          } else {
            return args.length > 2 ? this.evaluateExpression(args[2], visited) : false;
          }
        }

        // Standard Functions: SUM, AVERAGE, MIN, MAX, COUNT, COUNTA, PRODUCT, ROUND
        const openParenIdx = expr.indexOf('(');
        const closeParenIdx = expr.lastIndexOf(')');
        if (openParenIdx !== -1 && closeParenIdx === expr.length - 1) {
          const fn = upper.slice(0, openParenIdx).trim();
          const argStr = expr.slice(openParenIdx + 1, closeParenIdx);

          if (['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'COUNTA', 'PRODUCT'].includes(fn)) {
            const rawVals = this.resolveRangeValues(argStr, visited);
            if (fn === 'COUNTA') {
              return rawVals.filter(v => v !== '' && v !== null && v !== undefined).length;
            }
            const nums = rawVals.map(v => typeof v === 'number' ? v : parseFloat(v)).filter(v => !isNaN(v));
            if (fn === 'COUNT') return nums.length;
            if (nums.length === 0) return 0;
            if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
            if (fn === 'AVERAGE') return nums.reduce((a, b) => a + b, 0) / nums.length;
            if (fn === 'MIN') return Math.min(...nums);
            if (fn === 'MAX') return Math.max(...nums);
            if (fn === 'PRODUCT') return nums.reduce((a, b) => a * b, 1);
          } else if (fn === 'ROUND') {
            const args = this.splitArgs(argStr);
            const val = parseFloat(this.evaluateExpression(args[0], visited)) || 0;
            const decimals = args.length > 1 ? parseInt(this.evaluateExpression(args[1], visited), 10) || 0 : 0;
            const factor = Math.pow(10, decimals);
            return Math.round(val * factor) / factor;
          }
        }

        // Direct Single Cell Reference e.g. A1
        const cell = this.parseCellRef(expr);
        if (cell) {
          return this.getCellVal(cell.r, cell.c, visited);
        }

        // Arithmetic parsing without eval
        return this.parseArithmetic(expr, visited);
      }

      evaluateCondition(condStr, visited) {
        const ops = ['>=', '<=', '<>', '!=', '=', '>', '<'];
        for (const op of ops) {
          const idx = condStr.indexOf(op);
          if (idx !== -1) {
            const left = this.evaluateExpression(condStr.slice(0, idx), visited);
            const right = this.evaluateExpression(condStr.slice(idx + op.length), visited);

            const lNum = parseFloat(left);
            const rNum = parseFloat(right);
            const isNumeric = !isNaN(lNum) && !isNaN(rNum);

            const lVal = isNumeric ? lNum : String(left).toLowerCase();
            const rVal = isNumeric ? rNum : String(right).toLowerCase();

            switch (op) {
              case '=': return lVal === rVal;
              case '<>':
              case '!=': return lVal !== rVal;
              case '>': return lVal > rVal;
              case '<': return lVal < rVal;
              case '>=': return lVal >= rVal;
              case '<=': return lVal <= rVal;
            }
          }
        }
        return Boolean(this.evaluateExpression(condStr, visited));
      }

      parseArithmetic(expr, visited) {
        // Replace cell refs with numeric values
        let replaced = expr.replace(/[A-Z]+[0-9]+/gi, (match) => {
          const cell = this.parseCellRef(match);
          if (cell) {
            const val = this.getCellVal(cell.r, cell.c, visited);
            const num = parseFloat(val);
            return isNaN(num) ? '0' : String(num);
          }
          return match;
        });

        // Tokenize numbers, operators +, -, *, /, ^, (, )
        const tokens = [];
        let i = 0;
        while (i < replaced.length) {
          const ch = replaced[i];
          if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') { i++; continue; }
          if (/[0-9.]/.test(ch)) {
            let numStr = '';
            while (i < replaced.length && /[0-9.]/.test(replaced[i])) {
              numStr += replaced[i];
              i++;
            }
            tokens.push(parseFloat(numStr));
            continue;
          }
          if (['+', '-', '*', '/', '^', '(', ')'].includes(ch)) {
            if (ch === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(' || ['+', '-', '*', '/', '^'].includes(tokens[tokens.length - 1]))) {
              tokens.push('u-');
            } else {
              tokens.push(ch);
            }
            i++;
            continue;
          }
          i++;
        }

        // Shunting-yard
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, 'u-': 4 };
        const outputQueue = [];
        const opStack = [];

        for (const token of tokens) {
          if (typeof token === 'number') {
            outputQueue.push(token);
          } else if (token === '(') {
            opStack.push(token);
          } else if (token === ')') {
            while (opStack.length && opStack[opStack.length - 1] !== '(') {
              outputQueue.push(opStack.pop());
            }
            opStack.pop();
          } else {
            while (
              opStack.length &&
              opStack[opStack.length - 1] !== '(' &&
              precedence[opStack[opStack.length - 1]] >= precedence[token]
            ) {
              outputQueue.push(opStack.pop());
            }
            opStack.push(token);
          }
        }
        while (opStack.length) {
          outputQueue.push(opStack.pop());
        }

        // Postfix evaluation
        const stack = [];
        for (const token of outputQueue) {
          if (typeof token === 'number') {
            stack.push(token);
          } else if (token === 'u-') {
            const a = stack.pop() || 0;
            stack.push(-a);
          } else {
            const b = stack.pop() || 0;
            const a = stack.pop() || 0;
            switch (token) {
              case '+': stack.push(a + b); break;
              case '-': stack.push(a - b); break;
              case '*': stack.push(a * b); break;
              case '/':
                if (b === 0) return '#DIV/0!';
                stack.push(a / b);
                break;
              case '^': stack.push(Math.pow(a, b)); break;
            }
          }
        }
        return stack.length ? stack[0] : 0;
      }
    }

    // Excel Edu State
    const EXCEL_ROWS = 30;
    const EXCEL_COLS = 15;

    function createExcelGrid(rows = EXCEL_ROWS, cols = EXCEL_COLS) {
      return Array(rows).fill(null).map(() => Array(cols).fill(''));
    }

    let excelSheets = [
      { id: 'sheet1', name: 'Sheet1' }
    ];
    let activeSheetId = 'sheet1';
    let excelData = {
      sheet1: createExcelGrid()
    };
    let excelStyles = {
      sheet1: {} // key: "r,c" => { bold, italic, underline, align, format, decimals, fill, color, border }
    };
    let activeExcelCell = { r: 0, c: 0 };
    let excelAutoSave = true;
    let excelHistory = [];
    let excelRedoStack = [];
    let excelClipboard = null;
    let currentChartType = 'bar';

    // Safe Parser Instance
    const excelParser = new SafeExcelParser((r, c, visited) => {
      const grid = excelData[activeSheetId];
      if (!grid || r < 0 || r >= EXCEL_ROWS || c < 0 || c >= EXCEL_COLS) return 0;
      const key = `${r},${c}`;
      if (visited.has(key)) return '#REF!';
      visited.add(key);

      const raw = String(grid[r][c] || '').trim();
      if (raw.startsWith('=')) {
        return excelParser.evaluateExpression(raw, visited);
      }
      const num = parseFloat(raw);
      return !isNaN(num) && String(num) === raw ? num : raw;
    });

    // Formatting Cell Values for Display
    function formatCellValue(val, style = {}) {
      if (val === null || val === undefined || val === '') return '';
      if (typeof val === 'string' && (val.startsWith('#') || isNaN(parseFloat(val)))) {
        return val;
      }
      const num = typeof val === 'number' ? val : parseFloat(val);
      if (isNaN(num)) return String(val);

      const fmt = style.format || 'general';
      const dec = style.decimals !== undefined ? style.decimals : 2;

      if (fmt === 'currency') {
        return 'Rp ' + num.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      } else if (fmt === 'percent') {
        return (num * (val <= 1 ? 100 : 1)).toFixed(dec) + '%';
      } else if (fmt === 'comma' || fmt === 'number') {
        return num.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      }
      // General
      return String(Math.round(num * 10000) / 10000);
    }

    // Ribbon Tabs Switcher
    function switchExcelTab(tabName) {
      playSound('click');
      const tabs = ['home', 'insert', 'formulas', 'view'];
      tabs.forEach(t => {
        const btn = document.getElementById(`excel-tab-${t}`);
        const ribbon = document.getElementById(`excel-ribbon-${t}`);
        if (t === tabName) {
          if (btn) btn.className = 'px-3 py-1 text-emerald-700 font-bold border-b-2 border-emerald-600 hover:bg-gray-200 cursor-pointer transition-colors';
          if (ribbon) {
            ribbon.classList.remove('hidden');
            ribbon.classList.add('flex');
          }
        } else {
          if (btn) btn.className = 'px-3 py-1 text-gray-700 hover:text-emerald-700 hover:bg-gray-200 cursor-pointer transition-colors';
          if (ribbon) {
            ribbon.classList.remove('flex');
            ribbon.classList.add('hidden');
          }
        }
      });
      if (window.lucide) window.lucide.createIcons();
    }

    // Backstage File Menu
    function toggleExcelFileMenu(forceState) {
      playSound('click');
      const modal = document.getElementById('excel-file-modal');
      if (!modal) return;
      const isOpen = !modal.classList.contains('hidden');
      const newState = typeof forceState === 'boolean' ? forceState : !isOpen;

      if (newState) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      } else {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    // Initialize Headers
    function initExcelHeaders() {
      const tr = document.getElementById('excel-thead-tr');
      if (!tr) return;
      let html = `<th class="w-10 border-r border-b border-gray-300 bg-[#e6e6e6] sticky left-0 z-30 shadow-[1px_1px_0_#cbd5e1] select-none text-center">
                    <span class="text-[10px] text-gray-400 font-mono">◢</span>
                  </th>`;
      for (let i = 0; i < EXCEL_COLS; i++) {
        const letter = excelParser.indexToColName(i);
        html += `<th id="excel-th-col-${i}" class="min-w-[85px] w-24 border-r border-b border-gray-300 text-center text-[12px] text-gray-700 font-semibold bg-[#f3f2f1] hover:bg-emerald-100 cursor-pointer select-none py-1 transition-colors">${letter}</th>`;
      }
      tr.innerHTML = html;
    }

    // Render Full Excel Grid
    function renderExcel() {
      const tbody = document.getElementById('excel-tbody');
      if (!tbody) return;
      initExcelHeaders();
      renderExcelSheetTabs();

      const grid = excelData[activeSheetId] || createExcelGrid();
      const styles = excelStyles[activeSheetId] || {};

      let html = '';
      for (let r = 0; r < EXCEL_ROWS; r++) {
        html += `<tr id="excel-tr-${r}">`;
        html += `<td id="excel-td-row-${r}" class="border-r border-b border-gray-300 bg-[#f3f2f1] text-center text-[11px] text-gray-600 font-semibold sticky left-0 z-10 select-none hover:bg-emerald-100 cursor-pointer h-6 w-10">${r + 1}</td>`;

        for (let c = 0; c < EXCEL_COLS; c++) {
          const cellName = excelParser.indexToColName(c) + (r + 1);
          const cellStyle = styles[`${r},${c}`] || {};
          const isAct = activeExcelCell.r === r && activeExcelCell.c === c;

          let css = 'w-full h-full px-1.5 text-[12px] outline-none relative bg-transparent font-sans ';
          if (cellStyle.bold) css += 'font-bold ';
          if (cellStyle.italic) css += 'italic ';
          if (cellStyle.underline) css += 'underline ';
          if (cellStyle.align === 'center') css += 'text-center ';
          else if (cellStyle.align === 'right') css += 'text-right ';
          else css += 'text-left ';

          let tdStyle = '';
          if (cellStyle.fill && cellStyle.fill !== 'transparent') tdStyle += `background-color: ${cellStyle.fill}; `;
          if (cellStyle.color) tdStyle += `color: ${cellStyle.color}; `;
          if (cellStyle.border) tdStyle += 'border: 1.5px solid #000; ';

          html += `<td id="excel-cell-${r}-${c}" class="border-r border-b border-gray-300 p-0 relative ${isAct ? 'ring-2 ring-emerald-600 z-10' : ''}" style="${tdStyle}">
            <input type="text" id="excel-input-${r}-${c}" class="${css}"
                   value=""
                   oninput="updateExcel(${r}, ${c}, this.value)"
                   onfocus="excelFocus(${r}, ${c}, '${cellName}')"
                   onblur="excelBlur()"
                   onkeydown="onExcelCellKeyDown(event, ${r}, ${c})">
            ${isAct ? '<div class="w-1.5 h-1.5 bg-emerald-600 absolute -bottom-0.5 -right-0.5 z-20 pointer-events-none"></div>' : ''}
          </td>`;
        }
        html += '</tr>';
      }
      tbody.innerHTML = html;

      recalculateExcel();
      updateExcelActiveToolbar();
      updateExcelLiveStats();
    }

    // Recalculate and display values
    function recalculateExcel() {
      const grid = excelData[activeSheetId];
      if (!grid) return;
      const styles = excelStyles[activeSheetId] || {};

      for (let r = 0; r < EXCEL_ROWS; r++) {
        for (let c = 0; c < EXCEL_COLS; c++) {
          const input = document.getElementById(`excel-input-${r}-${c}`);
          if (!input) continue;

          const raw = String(grid[r][c] || '');
          if (activeExcelCell.r === r && activeExcelCell.c === c && document.activeElement === input) {
            // Display raw formula when focused
            input.value = raw;
          } else {
            // Display calculated & formatted value
            if (raw.startsWith('=')) {
              const res = excelParser.evaluateExpression(raw, new Set([`${r},${c}`]));
              input.value = formatCellValue(res, styles[`${r},${c}`]);
            } else {
              input.value = formatCellValue(raw, styles[`${r},${c}`]);
            }
          }
        }
      }
    }

    // Focus on a cell
    function excelFocus(r, c, name) {
      activeExcelCell = { r, c };
      
      const nameBox = document.getElementById('excel-active-cell');
      if (nameBox) nameBox.value = name || (excelParser.indexToColName(c) + (r + 1));

      const formulaBar = document.getElementById('excel-formula-bar');
      const grid = excelData[activeSheetId];
      if (formulaBar && grid) {
        formulaBar.value = grid[r][c] || '';
      }

      // Highlight headers
      for (let i = 0; i < EXCEL_COLS; i++) {
        const th = document.getElementById(`excel-th-col-${i}`);
        if (th) {
          if (i === c) th.classList.add('bg-emerald-200', 'text-emerald-900');
          else th.classList.remove('bg-emerald-200', 'text-emerald-900');
        }
      }
      for (let i = 0; i < EXCEL_ROWS; i++) {
        const td = document.getElementById(`excel-td-row-${i}`);
        if (td) {
          if (i === r) td.classList.add('bg-emerald-200', 'text-emerald-900');
          else td.classList.remove('bg-emerald-200', 'text-emerald-900');
        }
      }

      recalculateExcel();
      updateExcelActiveToolbar();
      updateExcelLiveStats();
    }

    function excelBlur() {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (!active.id.startsWith('excel-input') && active.id !== 'excel-formula-bar')) {
          recalculateExcel();
        }
      }, 80);
    }

    function updateExcel(r, c, val) {
      pushExcelState();
      excelData[activeSheetId][r][c] = val;

      if (activeExcelCell.r === r && activeExcelCell.c === c) {
        const formulaBar = document.getElementById('excel-formula-bar');
        if (formulaBar) formulaBar.value = val;
      }

      recalculateExcel();
      updateExcelLiveStats();
      triggerExcelAutoSave();
    }

    function updateFromFormulaBar(val) {
      const { r, c } = activeExcelCell;
      if (r >= 0 && c >= 0 && r < EXCEL_ROWS && c < EXCEL_COLS) {
        excelData[activeSheetId][r][c] = val;
        const input = document.getElementById(`excel-input-${r}-${c}`);
        if (input && document.activeElement !== input) {
          input.value = val;
        }
        recalculateExcel();
        updateExcelLiveStats();
        triggerExcelAutoSave();
      }
    }

    function acceptFormulaEdit() {
      playSound('click');
      recalculateExcel();
      showToast('Rumus sel berhasil diterapkan.');
    }

    function cancelFormulaEdit() {
      playSound('click');
      const { r, c } = activeExcelCell;
      if (r >= 0 && c >= 0) {
        const formulaBar = document.getElementById('excel-formula-bar');
        if (formulaBar) formulaBar.value = excelData[activeSheetId][r][c] || '';
        recalculateExcel();
      }
    }

    function onFormulaBarKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        acceptFormulaEdit();
        // Move to cell below
        if (activeExcelCell.r < EXCEL_ROWS - 1) {
          focusCell(activeExcelCell.r + 1, activeExcelCell.c);
        }
      } else if (e.key === 'Escape') {
        cancelFormulaEdit();
      }
    }

    function onExcelNameBoxKeyDown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const target = e.target.value.trim().toUpperCase();
        const cell = excelParser.parseCellRef(target);
        if (cell && cell.r >= 0 && cell.r < EXCEL_ROWS && cell.c >= 0 && cell.c < EXCEL_COLS) {
          focusCell(cell.r, cell.c);
        } else {
          showToast('Alamat sel tidak valid (contoh: B5 atau D10).');
        }
      }
    }

    function focusCell(r, c) {
      const cellName = excelParser.indexToColName(c) + (r + 1);
      const input = document.getElementById(`excel-input-${r}-${c}`);
      if (input) {
        input.focus();
        excelFocus(r, c, cellName);
      }
    }

    function onExcelCellKeyDown(e, r, c) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        if (!e.shiftKey && r < EXCEL_ROWS - 1) {
          e.preventDefault();
          focusCell(r + 1, c);
        }
      } else if (e.key === 'ArrowUp') {
        if (r > 0) {
          e.preventDefault();
          focusCell(r - 1, c);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Tab') {
        if (!e.shiftKey && c < EXCEL_COLS - 1) {
          e.preventDefault();
          focusCell(r, c + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (c > 0) {
          e.preventDefault();
          focusCell(r, c - 1);
        }
      }
    }

    function onExcelGridKeyDown(e) {
      // Container level navigation
    }

    // Cell Formatting
    function getActiveCellStyle() {
      const { r, c } = activeExcelCell;
      const key = `${r},${c}`;
      if (!excelStyles[activeSheetId]) excelStyles[activeSheetId] = {};
      if (!excelStyles[activeSheetId][key]) excelStyles[activeSheetId][key] = {};
      return excelStyles[activeSheetId][key];
    }

    function toggleExcelCellFormat(fmt) {
      playSound('click');
      const style = getActiveCellStyle();
      style[fmt] = !style[fmt];
      renderExcel();
      showToast(`Format ${fmt.toUpperCase()} diubah.`);
    }

    function setExcelCellFont(font) {
      playSound('click');
      const style = getActiveCellStyle();
      style.fontFamily = font;
      renderExcel();
    }

    function setExcelCellFontSize(sz) {
      playSound('click');
      const style = getActiveCellStyle();
      style.fontSize = sz + 'px';
      renderExcel();
    }

    function setExcelCellAlign(align) {
      playSound('click');
      const style = getActiveCellStyle();
      style.align = align;
      renderExcel();
      showToast(`Perataan sel: ${align}.`);
    }

    function toggleExcelColorPalette(type) {
      playSound('click');
      const palette = document.getElementById(`excel-palette-${type}`);
      if (!palette) return;
      const isHidden = palette.classList.contains('hidden');
      closeAllExcelPalettes();
      if (isHidden) palette.classList.remove('hidden');
    }

    function closeAllExcelPalettes() {
      const p1 = document.getElementById('excel-palette-fill');
      const p2 = document.getElementById('excel-palette-font');
      if (p1) p1.classList.add('hidden');
      if (p2) p2.classList.add('hidden');
    }

    function setExcelCellFill(color) {
      playSound('click');
      const style = getActiveCellStyle();
      style.fill = color;
      const bar = document.getElementById('excel-fill-color-bar');
      if (bar) bar.style.backgroundColor = color === 'transparent' ? '#cbd5e1' : color;
      closeAllExcelPalettes();
      renderExcel();
    }

    function setExcelCellTextColor(color) {
      playSound('click');
      const style = getActiveCellStyle();
      style.color = color;
      const bar = document.getElementById('excel-font-color-bar');
      if (bar) bar.style.backgroundColor = color;
      closeAllExcelPalettes();
      renderExcel();
    }

    function toggleExcelCellBorder() {
      playSound('click');
      const style = getActiveCellStyle();
      style.border = !style.border;
      renderExcel();
      showToast(style.border ? 'Garis batas (All Borders) dipasang.' : 'Garis batas dilepas.');
    }

    function setExcelNumberFormat(fmt) {
      playSound('click');
      const style = getActiveCellStyle();
      style.format = fmt;
      renderExcel();
      showToast(`Format angka: ${fmt}.`);
    }

    function adjustExcelDecimals(delta) {
      playSound('click');
      const style = getActiveCellStyle();
      const current = style.decimals !== undefined ? style.decimals : 2;
      style.decimals = Math.max(0, Math.min(6, current + delta));
      renderExcel();
    }

    function applyExcelCellStyle(preset) {
      playSound('click');
      const style = getActiveCellStyle();
      if (preset === 'good') {
        style.fill = '#dcfce7';
        style.color = '#15803d';
        style.bold = true;
      } else if (preset === 'bad') {
        style.fill = '#fee2e2';
        style.color = '#b91c1c';
        style.bold = true;
      } else if (preset === 'header') {
        style.fill = '#dbeafe';
        style.color = '#1e40af';
        style.bold = true;
        style.align = 'center';
      } else {
        style.fill = 'transparent';
        style.color = '#000000';
        style.bold = false;
        style.italic = false;
        style.underline = false;
      }
      renderExcel();
      showToast(`Gaya sel ${preset} diterapkan.`);
    }

    function toggleExcelWrapText() {
      playSound('click');
      showToast('Bungkus Teks (Wrap Text) diaktifkan pada sel.');
    }

    function toggleExcelMerge() {
      playSound('click');
      const style = getActiveCellStyle();
      style.align = 'center';
      style.bold = true;
      renderExcel();
      showToast('Gabung & Rata Tengah (Merge & Center) diterapkan.');
    }

    function updateExcelActiveToolbar() {
      const style = getActiveCellStyle();
      const btnB = document.getElementById('excel-btn-bold');
      const btnI = document.getElementById('excel-btn-italic');
      const btnU = document.getElementById('excel-btn-underline');

      if (btnB) btnB.className = `w-6 h-6 flex items-center justify-center rounded cursor-pointer font-bold font-serif text-xs border ${style.bold ? 'bg-emerald-200 border-emerald-500 text-emerald-900' : 'hover:bg-gray-200 border-transparent text-gray-800'}`;
      if (btnI) btnI.className = `w-6 h-6 flex items-center justify-center rounded cursor-pointer italic font-serif text-xs border ${style.italic ? 'bg-emerald-200 border-emerald-500 text-emerald-900' : 'hover:bg-gray-200 border-transparent text-gray-800'}`;
      if (btnU) btnU.className = `w-6 h-6 flex items-center justify-center rounded cursor-pointer underline font-serif text-xs border ${style.underline ? 'bg-emerald-200 border-emerald-500 text-emerald-900' : 'hover:bg-gray-200 border-transparent text-gray-800'}`;
    }

    // Insert & Delete Rows / Cols
    function insertExcelRow() {
      playSound('click');
      pushExcelState();
      const r = activeExcelCell.r;
      const grid = excelData[activeSheetId];
      grid.splice(r, 0, Array(EXCEL_COLS).fill(''));
      if (grid.length > EXCEL_ROWS) grid.pop();
      renderExcel();
      showToast(`Baris baru disisipkan di atas baris ${r + 1}.`);
    }

    function deleteExcelRow() {
      playSound('click');
      pushExcelState();
      const r = activeExcelCell.r;
      const grid = excelData[activeSheetId];
      grid.splice(r, 1);
      grid.push(Array(EXCEL_COLS).fill(''));
      renderExcel();
      showToast(`Baris ${r + 1} berhasil dihapus.`);
    }

    function insertExcelCol() {
      playSound('click');
      pushExcelState();
      const c = activeExcelCell.c;
      const grid = excelData[activeSheetId];
      grid.forEach(row => {
        row.splice(c, 0, '');
        if (row.length > EXCEL_COLS) row.pop();
      });
      renderExcel();
      showToast(`Kolom baru disisipkan sebelum kolom ${excelParser.indexToColName(c)}.`);
    }

    function deleteExcelCol() {
      playSound('click');
      pushExcelState();
      const c = activeExcelCell.c;
      const grid = excelData[activeSheetId];
      grid.forEach(row => {
        row.splice(c, 1);
        row.push('');
      });
      renderExcel();
      showToast(`Kolom ${excelParser.indexToColName(c)} berhasil dihapus.`);
    }

    function clearExcelCellContent() {
      playSound('click');
      const { r, c } = activeExcelCell;
      if (r >= 0 && c >= 0) {
        updateExcel(r, c, '');
        showToast('Isi sel dibersihkan.');
      }
    }

    function sortExcelColumn(order = 'asc') {
      playSound('click');
      pushExcelState();
      const c = activeExcelCell.c;
      const grid = excelData[activeSheetId];
      // Skip row 0 if it looks like a header
      const hasHeader = isNaN(parseFloat(grid[0][c])) && grid[0][c] !== '';
      const startRow = hasHeader ? 1 : 0;

      const subRows = grid.slice(startRow);
      subRows.sort((a, b) => {
        const valA = parseFloat(a[c]) || a[c] || '';
        const valB = parseFloat(b[c]) || b[c] || '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA;
        }
        return order === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });

      for (let i = 0; i < subRows.length; i++) {
        grid[startRow + i] = subRows[i];
      }
      renderExcel();
      showToast(`Kolom ${excelParser.indexToColName(c)} diurutkan ${order === 'asc' ? 'A-Z' : 'Z-A'}.`);
    }

    // AutoSum Helper
    function applyAutoSum(fn = 'SUM') {
      playSound('click');
      const { r, c } = activeExcelCell;
      if (r === 0) {
        showToast('Pilih sel di bawah deretan angka untuk AutoSum.');
        return;
      }
      // Scan upwards to find numeric rows
      const grid = excelData[activeSheetId];
      let startR = r - 1;
      while (startR >= 0 && grid[startR][c] !== '') {
        startR--;
      }
      startR = Math.max(0, startR + 1);

      const colName = excelParser.indexToColName(c);
      const formula = `=${fn}(${colName}${startR + 1}:${colName}${r})`;
      updateExcel(r, c, formula);
      showToast(`${fn} otomatis disisipkan: ${formula}`);
    }

    function insertFormulaTemplate(fn) {
      playSound('click');
      const { r, c } = activeExcelCell;
      const col = excelParser.indexToColName(c);
      let formula = '';
      if (fn === 'IF') {
        formula = `=IF(${col}${r + 1}>=75, "LULUS", "REMIDIAL")`;
      } else if (fn === 'ROUND') {
        formula = `=ROUND(${col}${r + 1}, 2)`;
      } else {
        formula = `=${fn}(${col}1:${col}${r + 1})`;
      }
      updateExcel(r, c, formula);
      showToast(`Rumus ${fn} disisipkan ke sel ${col}${r + 1}.`);
    }

    // Function Wizard Modal
    function openExcelFxWizard() {
      playSound('click');
      const modal = document.getElementById('excel-fx-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
      if (window.lucide) window.lucide.createIcons();
    }

    function closeExcelFxWizard() {
      playSound('click');
      const modal = document.getElementById('excel-fx-modal');
      if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
    }

    function useFxFunction(fn) {
      closeExcelFxWizard();
      insertFormulaTemplate(fn);
    }

    // Live Calculation Statistics (Status Bar)
    function updateExcelLiveStats() {
      const sumEl = document.getElementById('excel-stat-sum');
      const avgEl = document.getElementById('excel-stat-avg');
      const countEl = document.getElementById('excel-stat-count');
      if (!sumEl || !avgEl || !countEl) return;

      const grid = excelData[activeSheetId];
      if (!grid) return;
      const { c } = activeExcelCell;

      let nums = [];
      for (let r = 0; r < EXCEL_ROWS; r++) {
        const val = grid[r][c];
        if (val !== '' && val !== null && val !== undefined) {
          const evaluated = typeof val === 'string' && val.startsWith('=') ? excelParser.evaluateExpression(val) : val;
          const num = parseFloat(evaluated);
          if (!isNaN(num)) nums.push(num);
        }
      }

      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        const avg = sum / nums.length;
        sumEl.innerText = 'SUM: ' + Math.round(sum * 100) / 100;
        avgEl.innerText = 'AVG: ' + Math.round(avg * 100) / 100;
        countEl.innerText = 'COUNT: ' + nums.length;
      } else {
        sumEl.innerText = 'SUM: 0';
        avgEl.innerText = 'AVG: 0';
        countEl.innerText = 'COUNT: 0';
      }
    }

    // Sheet Tabs Management
    function renderExcelSheetTabs() {
      const container = document.getElementById('excel-sheet-tabs');
      if (!container) return;
      container.innerHTML = excelSheets.map(s => {
        const isAct = s.id === activeSheetId;
        return `<button onclick="switchExcelSheet('${s.id}')" ondblclick="renameCurrentExcelSheet()" class="px-3 sm:px-4 h-full flex items-center text-xs font-semibold cursor-pointer border-r border-gray-300 transition-colors ${isAct ? 'bg-white text-emerald-800 border-b-2 border-b-emerald-600 shadow-2xs font-bold' : 'text-gray-600 hover:bg-gray-200'}">${s.name}</button>`;
      }).join('');
    }

    function switchExcelSheet(sheetId) {
      playSound('click');
      activeSheetId = sheetId;
      if (!excelData[sheetId]) excelData[sheetId] = createExcelGrid();
      if (!excelStyles[sheetId]) excelStyles[sheetId] = {};
      activeExcelCell = { r: 0, c: 0 };
      renderExcel();
      showToast(`Beralih ke ${excelSheets.find(s => s.id === sheetId)?.name || sheetId}.`);
    }

    function addNewExcelSheet() {
      playSound('click');
      const count = excelSheets.length + 1;
      const newId = 'sheet' + Date.now();
      const newName = 'Sheet' + count;
      excelSheets.push({ id: newId, name: newName });
      excelData[newId] = createExcelGrid();
      excelStyles[newId] = {};
      switchExcelSheet(newId);
    }

    function renameCurrentExcelSheet() {
      playSound('click');
      const sheet = excelSheets.find(s => s.id === activeSheetId);
      if (!sheet) return;
      const newName = prompt('Masukkan nama lembar kerja baru:', sheet.name);
      if (newName && newName.trim()) {
        sheet.name = newName.trim();
        renderExcelSheetTabs();
        showToast(`Nama sheet diubah ke ${sheet.name}.`);
      }
    }

    function scrollExcelSheets(dir) {
      const container = document.getElementById('excel-sheet-tabs');
      if (container) container.scrollBy({ left: dir * 80, behavior: 'smooth' });
    }

    // Interactive Chart Visualizer
    function showExcelChartModal(type = 'bar') {
      playSound('click');
      currentChartType = type;
      const modal = document.getElementById('excel-chart-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        renderExcelChartSVG(type);
      }
      if (window.lucide) window.lucide.createIcons();
    }

    function closeExcelChartModal() {
      playSound('click');
      const modal = document.getElementById('excel-chart-modal');
      if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
      }
    }

    function renderExcelChartSVG(type) {
      playSound('click');
      currentChartType = type;
      const container = document.getElementById('excel-chart-svg-container');
      const titleEl = document.getElementById('excel-chart-title');
      if (!container) return;

      // Update button styling
      ['bar', 'pie', 'line'].forEach(t => {
        const btn = document.getElementById(`btn-chart-type-${t}`);
        if (btn) {
          if (t === type) btn.className = 'px-2.5 py-1 rounded border border-emerald-500 bg-emerald-100 text-emerald-800 font-bold cursor-pointer';
          else btn.className = 'px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer';
        }
      });

      // Extract labels from Col A and numbers from Col B or active column
      const grid = excelData[activeSheetId];
      const targetCol = activeExcelCell.c > 0 ? activeExcelCell.c : 1;
      const colName = excelParser.indexToColName(targetCol);

      let dataPoints = [];
      for (let r = 1; r < 12; r++) { // read top rows
        const label = String(grid[r][0] || '').trim();
        let valRaw = grid[r][targetCol];
        if (typeof valRaw === 'string' && valRaw.startsWith('=')) {
          valRaw = excelParser.evaluateExpression(valRaw);
        }
        const val = parseFloat(valRaw);
        if (label && !isNaN(val)) {
          dataPoints.push({ label, val });
        }
      }

      if (dataPoints.length === 0) {
        // Fallback educational sample data
        dataPoints = [
          { label: 'Budi Santoso', val: 85 },
          { label: 'Siti Rahma', val: 92 },
          { label: 'Ahmad Faiz', val: 78 },
          { label: 'Dewi Lestari', val: 88 },
          { label: 'Rian Pratama', val: 70 }
        ];
      }

      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
      const maxVal = Math.max(...dataPoints.map(d => d.val), 100);

      if (titleEl) titleEl.innerText = `Visualisasi Data Siswa (Kolom ${colName}) - Grafik ${type.toUpperCase()}`;

      if (type === 'bar') {
        const svgW = 520;
        const svgH = 240;
        const barW = Math.max(24, Math.floor(320 / dataPoints.length) - 10);
        const gap = 12;
        const startX = 60;
        const baseY = 200;

        let bars = dataPoints.map((d, i) => {
          const h = (d.val / maxVal) * 150;
          const x = startX + i * (barW + gap);
          const y = baseY - h;
          const col = colors[i % colors.length];
          return `
            <g>
              <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${col}" rx="4" class="transition-all hover:opacity-80">
                <title>${d.label}: ${d.val}</title>
              </rect>
              <text x="${x + barW / 2}" y="${y - 6}" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">${d.val}</text>
              <text x="${x + barW / 2}" y="${baseY + 16}" font-size="10" fill="#64748b" text-anchor="middle" transform="rotate(15, ${x + barW / 2}, ${baseY + 16})">${d.label.slice(0, 8)}</text>
            </g>
          `;
        }).join('');

        container.innerHTML = `
          <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full max-w-lg h-auto">
            <!-- Grid Lines -->
            <line x1="50" y1="50" x2="480" y2="50" stroke="#e2e8f0" stroke-dasharray="4" />
            <text x="40" y="54" font-size="10" fill="#94a3b8" text-anchor="end">${Math.round(maxVal)}</text>
            <line x1="50" y1="125" x2="480" y2="125" stroke="#e2e8f0" stroke-dasharray="4" />
            <text x="40" y="129" font-size="10" fill="#94a3b8" text-anchor="end">${Math.round(maxVal / 2)}</text>
            <line x1="50" y1="${baseY}" x2="480" y2="${baseY}" stroke="#cbd5e1" stroke-width="2" />
            <text x="40" y="${baseY + 4}" font-size="10" fill="#94a3b8" text-anchor="end">0</text>
            ${bars}
          </svg>
        `;
      } else if (type === 'pie') {
        const total = dataPoints.reduce((acc, d) => acc + d.val, 0);
        let currAngle = 0;
        const cx = 150;
        const cy = 130;
        const r = 90;

        let slices = dataPoints.map((d, i) => {
          const sliceAngle = (d.val / total) * 2 * Math.PI;
          const x1 = cx + r * Math.cos(currAngle);
          const y1 = cy + r * Math.sin(currAngle);
          const x2 = cx + r * Math.cos(currAngle + sliceAngle);
          const y2 = cy + r * Math.sin(currAngle + sliceAngle);
          const largeArc = sliceAngle > Math.PI ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          currAngle += sliceAngle;
          return `<path d="${path}" fill="${colors[i % colors.length]}" stroke="#ffffff" stroke-width="2" class="hover:opacity-85"><title>${d.label}: ${d.val}</title></path>`;
        }).join('');

        let legend = dataPoints.map((d, i) => {
          return `<div class="flex items-center gap-1.5 text-xs text-gray-700 mb-1">
            <span class="w-3 h-3 rounded-full" style="background-color: ${colors[i % colors.length]}"></span>
            <span class="truncate max-w-[120px] font-medium">${d.label}: <b>${d.val}</b></span>
          </div>`;
        }).join('');

        container.innerHTML = `
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
            <svg viewBox="0 0 300 260" class="w-56 h-56">
              ${slices}
            </svg>
            <div class="flex flex-col">
              <div class="text-xs font-bold text-gray-600 mb-2 uppercase">Keterangan Data:</div>
              ${legend}
            </div>
          </div>
        `;
      } else if (type === 'line') {
        const svgW = 500;
        const svgH = 220;
        const startX = 60;
        const gap = Math.max(30, Math.floor(380 / (dataPoints.length - 1 || 1)));
        const baseY = 180;

        const points = dataPoints.map((d, i) => {
          const x = startX + i * gap;
          const y = baseY - (d.val / maxVal) * 130;
          return { x, y, label: d.label, val: d.val };
        });

        const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const circles = points.map((p, i) => `
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#10b981" stroke="#ffffff" stroke-width="2" class="hover:scale-125 transition-transform">
            <title>${p.label}: ${p.val}</title>
          </circle>
          <text x="${p.x}" y="${p.y - 8}" font-size="10" font-weight="bold" fill="#065f46" text-anchor="middle">${p.val}</text>
          <text x="${p.x}" y="${baseY + 16}" font-size="10" fill="#64748b" text-anchor="middle">${p.label.slice(0, 6)}</text>
        `).join('');

        container.innerHTML = `
          <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full max-w-lg h-auto">
            <line x1="40" y1="${baseY}" x2="480" y2="${baseY}" stroke="#cbd5e1" stroke-width="2" />
            <path d="${pathStr}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            ${circles}
          </svg>
        `;
      }
    }

    // Templates
    function newExcelWorkbook() {
      playSound('click');
      excelSheets = [{ id: 'sheet1', name: 'Sheet1' }];
      activeSheetId = 'sheet1';
      excelData = { sheet1: createExcelGrid() };
      excelStyles = { sheet1: {} };
      activeExcelCell = { r: 0, c: 0 };
      toggleExcelFileMenu(false);
      renderExcel();
      showToast('Buku kerja kosong siap digunakan.');
    }

    function openExcelTemplate(tplNum) {
      playSound('click');
      newExcelWorkbook();
      const grid = excelData[activeSheetId];
      const styles = excelStyles[activeSheetId];

      if (tplNum === 1) {
        // Daftar Nilai Siswa Informatika SMP
        const titleDoc = document.getElementById('excel-doc-title');
        if (titleDoc) titleDoc.innerText = 'Daftar_Nilai_Informatika_Kelas7.xlsx - Excel Edu';

        grid[0] = ['NO', 'NAMA SISWA', 'TUGAS 1', 'TUGAS 2', 'UTS', 'UAS', 'NILAI AKHIR', 'STATUS KELULUSAN', '', '', '', '', '', '', ''];
        
        const students = [
          ['1', 'Ahmad Rizki', '85', '80', '88', '90'],
          ['2', 'Budi Santoso', '70', '75', '68', '72'],
          ['3', 'Citra Kirana', '90', '95', '92', '96'],
          ['4', 'Dewi Sartika', '65', '70', '60', '65'],
          ['5', 'Eko Prasetyo', '80', '85', '78', '82'],
          ['6', 'Fani Rahmawati', '88', '90', '85', '87'],
          ['7', 'Guruh Permana', '60', '65', '58', '62'],
          ['8', 'Hana Maharani', '92', '94', '90', '95']
        ];

        students.forEach((s, idx) => {
          const row = idx + 1;
          grid[row][0] = s[0];
          grid[row][1] = s[1];
          grid[row][2] = s[2];
          grid[row][3] = s[3];
          grid[row][4] = s[4];
          grid[row][5] = s[5];
          // Formula Average and IF
          grid[row][6] = `=ROUND(AVERAGE(C${row + 1}:F${row + 1}), 1)`;
          grid[row][7] = `=IF(G${row + 1}>=75, "LULUS", "REMIDIAL")`;
        });

        // Summary Rows
        grid[10][1] = 'RATA-RATA KELAS';
        grid[10][6] = '=ROUND(AVERAGE(G2:G9), 1)';
        grid[11][1] = 'NILAI TERTINGGI';
        grid[11][6] = '=MAX(G2:G9)';
        grid[12][1] = 'NILAI TERENDAH';
        grid[12][6] = '=MIN(G2:G9)';

        // Apply Styles
        for (let c = 0; c < 8; c++) {
          styles[`0,${c}`] = { bold: true, fill: '#d1fae5', color: '#065f46', align: 'center', border: true };
        }
        for (let r = 1; r <= 8; r++) {
          styles[`${r},0`] = { align: 'center' };
          styles[`${r},6`] = { bold: true, align: 'right' };
          styles[`${r},7`] = { bold: true, align: 'center', fill: '#f0fdf4', color: '#166534' };
        }
        styles['10,1'] = { bold: true };
        styles['10,6'] = { bold: true, fill: '#e0f2fe' };
        styles['11,1'] = { bold: true };
        styles['11,6'] = { bold: true, fill: '#fef3c7' };
        styles['12,1'] = { bold: true };
        styles['12,6'] = { bold: true, fill: '#fee2e2' };

        showToast('Template Daftar Nilai Siswa (AVERAGE & IF) dimuat.');

      } else if (tplNum === 2) {
        // Buku Kas Kelas 7
        const titleDoc = document.getElementById('excel-doc-title');
        if (titleDoc) titleDoc.innerText = 'Buku_Kas_Kelas_7.xlsx - Excel Edu';

        grid[0] = ['NO', 'TANGGAL', 'URAIAN TRANSAKSI', 'PEMASUKAN (Rp)', 'PENGELUARAN (Rp)', 'SALDO (Rp)', '', '', '', '', '', '', '', '', ''];
        
        const entries = [
          ['1', '01/10/2026', 'Saldo Awal Kas', '250000', '0'],
          ['2', '05/10/2026', 'Iuran Mingguan Siswa', '120000', '0'],
          ['3', '08/10/2026', 'Beli Spidol & Penghapus', '0', '35000'],
          ['4', '12/10/2026', 'Iuran Mingguan Siswa', '120000', '0'],
          ['5', '18/10/2026', 'Beli Sapu & Tempat Sampah', '0', '55000'],
          ['6', '25/10/2026', 'Iuran Kas Praktikum', '80000', '0']
        ];

        entries.forEach((e, idx) => {
          const row = idx + 1;
          grid[row][0] = e[0];
          grid[row][1] = e[1];
          grid[row][2] = e[2];
          grid[row][3] = e[3];
          grid[row][4] = e[4];
          if (row === 1) {
            grid[row][5] = '=D2 - E2';
          } else {
            grid[row][5] = `=F${row} + D${row + 1} - E${row + 1}`;
          }
        });

        // Totals
        grid[8][2] = 'TOTAL PEMASUKAN & PENGELUARAN';
        grid[8][3] = '=SUM(D2:D7)';
        grid[8][4] = '=SUM(E2:E7)';
        grid[9][2] = 'SISA SALDO AKHIR BULAN';
        grid[9][5] = '=F7';

        for (let c = 0; c < 6; c++) {
          styles[`0,${c}`] = { bold: true, fill: '#fef3c7', color: '#92400e', align: 'center', border: true };
        }
        for (let r = 1; r <= 6; r++) {
          styles[`${r},3`] = { format: 'currency', align: 'right' };
          styles[`${r},4`] = { format: 'currency', align: 'right' };
          styles[`${r},5`] = { format: 'currency', align: 'right', bold: true, fill: '#ecfdf5' };
        }
        styles['8,2'] = { bold: true };
        styles['8,3'] = { bold: true, format: 'currency' };
        styles['8,4'] = { bold: true, format: 'currency' };
        styles['9,2'] = { bold: true, fill: '#d1fae5' };
        styles['9,5'] = { bold: true, format: 'currency', fill: '#a7f3d0' };

        showToast('Template Buku Kas Kelas (SUM & Saldo) dimuat.');

      } else if (tplNum === 3) {
        // Inventaris Lab Komputer
        const titleDoc = document.getElementById('excel-doc-title');
        if (titleDoc) titleDoc.innerText = 'Inventaris_Lab_Komputer.xlsx - Excel Edu';

        grid[0] = ['KODE', 'NAMA PERANGKAT', 'JUMLAH (UNIT)', 'HARGA SATUAN (Rp)', 'TOTAL NILAI (Rp)', 'KONDISI', '', '', '', '', '', '', '', '', ''];
        
        const items = [
          ['PC-01', 'PC All-in-One Siswa', '32', '6500000', 'Baik'],
          ['PC-02', 'PC Desktop Guru', '1', '9500000', 'Baik'],
          ['NET-01', 'Switch Hub 24-Port', '2', '1250000', 'Baik'],
          ['PRN-01', 'Printer Laserjet', '2', '2400000', 'Baik'],
          ['UPS-01', 'UPS Server 1200VA', '3', '1800000', 'Baik'],
          ['PRJ-01', 'Proyektor Ruang Lab', '1', '4500000', 'Baik']
        ];

        items.forEach((it, idx) => {
          const row = idx + 1;
          grid[row][0] = it[0];
          grid[row][1] = it[1];
          grid[row][2] = it[2];
          grid[row][3] = it[3];
          grid[row][4] = `=C${row + 1} * D${row + 1}`;
          grid[row][5] = it[4];
        });

        grid[8][1] = 'TOTAL PERANGKAT & ASET LAB';
        grid[8][2] = '=SUM(C2:C7)';
        grid[8][4] = '=SUM(E2:E7)';

        for (let c = 0; c < 6; c++) {
          styles[`0,${c}`] = { bold: true, fill: '#e0f2fe', color: '#0369a1', align: 'center', border: true };
        }
        for (let r = 1; r <= 6; r++) {
          styles[`${r},2`] = { align: 'center' };
          styles[`${r},3`] = { format: 'currency', align: 'right' };
          styles[`${r},4`] = { format: 'currency', align: 'right', bold: true };
          styles[`${r},5`] = { align: 'center', fill: '#f0fdf4' };
        }
        styles['8,1'] = { bold: true };
        styles['8,2'] = { bold: true, align: 'center' };
        styles['8,4'] = { bold: true, format: 'currency', fill: '#dbeafe' };

        showToast('Template Inventaris Komputer Lab dimuat.');
      }

      toggleExcelFileMenu(false);
      renderExcel();
    }

    // Persistence & File Export
    function loadExcelWorkbook(fileId) {
      if (typeof EduStorage === 'undefined') return;
      const file = EduStorage.getFileById(fileId);
      if (!file || !file.content) return;
      currentExcelFileId = fileId;

      // Handle raw content structure from template/EduStorage
      if (file.content.data && file.content.sheets) {
        excelSheets = file.content.sheets;
        activeSheetId = file.content.activeSheetId || 'sheet1';
        excelData = file.content.data;
        excelStyles = file.content.styles || { [activeSheetId]: {} };
      } else if (file.content.sheets) {
        // Convert simple sheet structure into excelData
        excelSheets = [];
        excelData = {};
        excelStyles = {};
        let sIdx = 1;
        Object.keys(file.content.sheets).forEach(sName => {
          const sId = 'sheet' + sIdx++;
          excelSheets.push({ id: sId, name: sName });
          const grid = createExcelGrid();
          const sCells = file.content.sheets[sName];
          Object.keys(sCells).forEach(cellKey => {
            const m = cellKey.match(/^([A-Z]+)([0-9]+)$/);
            if (m) {
              const c = m[1].charCodeAt(0) - 65;
              const r = parseInt(m[2]) - 1;
              if (r >= 0 && r < 30 && c >= 0 && c < 15) {
                grid[r][c] = sCells[cellKey];
              }
            }
          });
          excelData[sId] = grid;
          excelStyles[sId] = {};
        });
        activeSheetId = excelSheets[0].id;
      }

      const titleEl = document.getElementById('excel-doc-title');
      if (titleEl) {
        titleEl.innerText = `${file.name} - Excel Edu`;
      }

      EduStorage.activeDocs.excel = fileId;
      renderExcelSheetTabs();
      renderExcel();
    }

    function saveExcelWorkbook(asNew = false) {
      playSound('click');
      if (asNew || !currentExcelFileId) {
        if (typeof showEduPromptModal === 'function') {
          showEduPromptModal({
            title: 'Simpan Buku Kerja Excel Sebagai',
            message: 'Masukkan nama berkas buku kerja baru:',
            defaultValue: 'Buku_Kerja_Informatika.xlsx',
            placeholder: 'contoh: Latihan_Tabel_Nilai.xlsx',
            confirmText: 'Simpan',
            onConfirm: (wbName) => {
              if (!wbName || !wbName.trim()) wbName = 'Buku_Kerja_Baru.xlsx';
              if (!wbName.toLowerCase().endsWith('.xlsx')) wbName += '.xlsx';

              const newFile = EduStorage.saveFile({
                name: wbName,
                type: 'excel',
                app: 'excel',
                content: {
                  sheets: excelSheets,
                  activeSheetId: activeSheetId,
                  data: excelData,
                  styles: excelStyles
                }
              });
              currentExcelFileId = newFile.id;
              EduStorage.activeDocs.excel = newFile.id;

              const titleEl = document.getElementById('excel-doc-title');
              if (titleEl) titleEl.innerText = `${newFile.name} - Excel Edu`;

              const badge = document.getElementById('excel-saved-msg');
              if (badge) {
                badge.classList.remove('hidden');
                setTimeout(() => badge.classList.add('hidden'), 2500);
              }
              showToast(`💾 "${newFile.name}" berhasil disimpan ke EduOS Storage.`);
            }
          });
        }
        return;
      }

      const currentFile = typeof EduStorage !== 'undefined' ? EduStorage.getFileById(currentExcelFileId) : null;
      const fileName = currentFile ? currentFile.name : 'Buku_Kerja_Excel.xlsx';

      if (typeof EduStorage !== 'undefined') {
        EduStorage.saveFile({
          id: currentExcelFileId,
          name: fileName,
          type: 'excel',
          app: 'excel',
          content: {
            sheets: excelSheets,
            activeSheetId: activeSheetId,
            data: excelData,
            styles: excelStyles
          }
        });
      }

      const badge = document.getElementById('excel-saved-msg');
      if (badge) {
        badge.classList.remove('hidden');
        setTimeout(() => badge.classList.add('hidden'), 2500);
      }
      showToast(`💾 "${fileName}" berhasil disimpan ke EduOS Storage.`);
    }

    function toggleExcelAutoSave() {
      playSound('click');
      excelAutoSave = !excelAutoSave;
      const toggle = document.getElementById('excel-autosave-toggle');
      if (toggle) {
        if (excelAutoSave) {
          toggle.className = 'w-6 h-3.5 bg-emerald-600 rounded-full relative cursor-pointer';
          toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm transition-all"></div>';
          showToast('AutoSave Excel diaktifkan.');
        } else {
          toggle.className = 'w-6 h-3.5 bg-gray-400 rounded-full relative cursor-pointer';
          toggle.innerHTML = '<div class="w-2.5 h-2.5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-all"></div>';
          showToast('AutoSave Excel dinonaktifkan.');
        }
      }
    }

    let excelAutoSaveTimer = null;
    function triggerExcelAutoSave() {
      if (!excelAutoSave) return;
      clearTimeout(excelAutoSaveTimer);
      excelAutoSaveTimer = setTimeout(() => {
        saveExcelWorkbook(false);
      }, 2000);
    }

    function exportExcelAsCsv() {
      playSound('click');
      const grid = excelData[activeSheetId];
      if (!grid) return;

      let csv = '';
      for (let r = 0; r < EXCEL_ROWS; r++) {
        const rowVals = [];
        let hasContent = false;
        for (let c = 0; c < EXCEL_COLS; c++) {
          const val = String(grid[r][c] || '').replace(/"/g, '""');
          if (val) hasContent = true;
          rowVals.push(`"${val}"`);
        }
        if (hasContent) {
          csv += rowVals.join(',') + '\r\n';
        }
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Buku_Kerja_Informatika.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Berkas CSV berhasil diunduh.');
    }

    function printExcelSheet() {
      playSound('click');
      window.print();
    }

    function searchInExcel(query) {
      if (!query || !query.trim()) return;
      const q = query.toLowerCase().trim();
      const grid = excelData[activeSheetId];
      if (!grid) return;

      for (let r = 0; r < EXCEL_ROWS; r++) {
        for (let c = 0; c < EXCEL_COLS; c++) {
          const val = String(grid[r][c] || '').toLowerCase();
          if (val.includes(q)) {
            focusCell(r, c);
            showToast(`Ditemukan di sel ${excelParser.indexToColName(c)}${r + 1}: ${grid[r][c]}`);
            return;
          }
        }
      }
      showToast('Data tidak ditemukan dalam lembar kerja.');
    }

    // View toggles
    function toggleExcelGridlines(show) {
      playSound('click');
      const table = document.getElementById('excel-table');
      if (!table) return;
      const cells = table.querySelectorAll('td, th');
      cells.forEach(el => {
        if (!show) el.classList.remove('border-r', 'border-b', 'border-gray-300');
        else el.classList.add('border-r', 'border-b', 'border-gray-300');
      });
      showToast(show ? 'Garis kisi ditampilkan.' : 'Garis kisi disembunyikan.');
    }

    function toggleExcelHeadings(show) {
      playSound('click');
      const thead = document.getElementById('excel-thead');
      const firstCols = document.querySelectorAll('td.sticky.left-0');
      if (thead) thead.style.display = show ? '' : 'none';
      firstCols.forEach(el => el.style.display = show ? '' : 'none');
      showToast(show ? 'Header kolom dan baris ditampilkan.' : 'Header kolom dan baris disembunyikan.');
    }

    // Undo / Redo
    function pushExcelState() {
      const grid = excelData[activeSheetId];
      if (grid) {
        excelHistory.push(JSON.stringify(grid));
        if (excelHistory.length > 20) excelHistory.shift();
        excelRedoStack = [];
      }
    }

    function undoExcel() {
      playSound('click');
      if (excelHistory.length > 0) {
        excelRedoStack.push(JSON.stringify(excelData[activeSheetId]));
        excelData[activeSheetId] = JSON.parse(excelHistory.pop());
        renderExcel();
        showToast('Urungkan (Undo) berhasil.');
      } else {
        showToast('Tidak ada aksi untuk diurungkan.');
      }
    }

    function redoExcel() {
      playSound('click');
      if (excelRedoStack.length > 0) {
        excelHistory.push(JSON.stringify(excelData[activeSheetId]));
        excelData[activeSheetId] = JSON.parse(excelRedoStack.pop());
        renderExcel();
        showToast('Ulangi (Redo) berhasil.');
      } else {
        showToast('Tidak ada aksi untuk diulangi.');
      }
    }

    function copyExcelCell() {
      playSound('click');
      const { r, c } = activeExcelCell;
      excelClipboard = {
        val: excelData[activeSheetId][r][c],
        style: { ...(excelStyles[activeSheetId][`${r},${c}`] || {}) }
      };
      showToast(`Sel ${excelParser.indexToColName(c)}${r + 1} disalin ke clipboard.`);
    }

    function cutExcelCell() {
      copyExcelCell();
      clearExcelCellContent();
    }

    function pasteExcelCell() {
      playSound('click');
      if (!excelClipboard) {
        showToast('Clipboard Excel masih kosong.');
        return;
      }
      const { r, c } = activeExcelCell;
      updateExcel(r, c, excelClipboard.val);
      excelStyles[activeSheetId][`${r},${c}`] = { ...excelClipboard.style };
      renderExcel();
      showToast(`Data ditempelkan ke sel ${excelParser.indexToColName(c)}${r + 1}.`);
    }

    function applyTablePreset() {
      playSound('click');
      // Format current range as table
      for (let c = 0; c < 6; c++) {
        excelStyles[activeSheetId][`0,${c}`] = { bold: true, fill: '#10b981', color: '#ffffff', align: 'center', border: true };
      }
      for (let r = 1; r < 8; r++) {
        for (let c = 0; c < 6; c++) {
          excelStyles[activeSheetId][`${r},${c}`] = { fill: r % 2 === 0 ? '#f0fdf4' : '#ffffff', border: true };
        }
      }
      renderExcel();
      showToast('Gaya Tabel Akademik EduOS diterapkan.');
    }

    function insertExcelSymbol(sym) {
      playSound('click');
      const { r, c } = activeExcelCell;
      const cur = excelData[activeSheetId][r][c] || '';
      updateExcel(r, c, cur + sym);
      showToast(`Simbol ${sym} disisipkan.`);
    }

    


// Global Bridge Export for Excel Edu
if (typeof window !== 'undefined') {
  window.loadExcelWorkbook = loadExcelWorkbook;
  window.saveExcelWorkbook = saveExcelWorkbook;
  window.newExcelWorkbook = newExcelWorkbook;
  window.openExcelTemplate = openExcelTemplate;
  window.exportExcelAsCsv = exportExcelAsCsv;
  window.renderExcel = renderExcel;
  window.renderExcelSheetTabs = renderExcelSheetTabs;
}
if (typeof globalThis !== 'undefined') {
  globalThis.loadExcelWorkbook = loadExcelWorkbook;
  globalThis.saveExcelWorkbook = saveExcelWorkbook;
  globalThis.newExcelWorkbook = newExcelWorkbook;
  globalThis.openExcelTemplate = openExcelTemplate;
  globalThis.exportExcelAsCsv = exportExcelAsCsv;
  globalThis.renderExcel = renderExcel;
  globalThis.renderExcelSheetTabs = renderExcelSheetTabs;
}
