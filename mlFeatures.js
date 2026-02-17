// mlFeatures.js
// Calcula y guarda automáticamente todos los features de ML
// cada vez que se registra un nuevo gasto.

// Mapa de necesidad por macrocategoría (0-100)
// Cuanto más alto, más "necesario" es el gasto
const CATEGORY_NECESSITY_MAP = {
    "🏠 Vivienda y hogar": 90,
    "🧾 Alimentos y bebidas": 100,
    "🏥 Salud y bienestar": 95,
    "📚 Educación y formación": 85,
    "🚗 Transporte y movilidad": 65,
    "👶 Familia y dependientes": 85,
    "🧹 Servicios personales y profesionales": 65,
    "🏦 Finanzas y obligaciones": 70,
    "🧑‍💻 Tecnología y comunicaciones": 55,
    "👕 Ropa y accesorios": 50,
    "🏗️ Construcción y remodelación": 35,
    "🎮 Entretenimiento y ocio": 40,
    "✈️ Viajes y turismo": 20,
    "🎁 Regalos y celebraciones": 25,
    "🧾 Otros gastos controlados": 45,
  };
  
  /**
   * Función principal. Llámala después de insertar un gasto.
   * Es async y no bloquea la respuesta al usuario.
   * 
   * @param {string} expenseId - UUID del gasto recién creado
   * @param {string} userId    - UUID del usuario
   * @param {object} expenseData - { total_amount, macrocategoria, categoria, created_at }
   * @param {object} pool      - Pool de PostgreSQL de server.js
   */
  async function calculateAndSaveMLFeatures(expenseId, userId, expenseData, pool) {
    try {
      console.log(`🤖 [ML] Calculando features para gasto ${expenseId}...`);
  
      const amount = parseFloat(expenseData.total_amount);
      const macrocategoria = expenseData.macrocategoria || "";
      const categoria = expenseData.categoria || "";
      // Fecha del gasto (puede ser created_at o NOW)
      const expenseDate = expenseData.created_at
        ? new Date(expenseData.created_at)
        : new Date();
  
      // ─────────────────────────────────────────────────────────────
      // QUERY 1: Historial de GASTOS del usuario (excluyendo el actual)
      // ─────────────────────────────────────────────────────────────
      const expensesQuery = `
        SELECT 
          total_amount,
          macrocategoria,
          created_at
        FROM expenses
        WHERE user_id = $1
          AND expense_id != $2
        ORDER BY created_at DESC
      `;
      const expensesResult = await pool.query(expensesQuery, [userId, expenseId]);
      const pastExpenses = expensesResult.rows;
  
      // ─────────────────────────────────────────────────────────────
      // QUERY 2: Historial de INGRESOS del usuario
      // ─────────────────────────────────────────────────────────────
      const incomesQuery = `
        SELECT 
          total_amount,
          created_at
        FROM incomes
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const incomesResult = await pool.query(incomesQuery, [userId]);
      const pastIncomes = incomesResult.rows;
  
      // ─────────────────────────────────────────────────────────────
      // QUERY 3: RECORDATORIOS del usuario
      // ─────────────────────────────────────────────────────────────
      const remindersQuery = `
        SELECT 
          total_amount,
          next_payment_date
        FROM reminders
        WHERE user_id = $1
      `;
      const remindersResult = await pool.query(remindersQuery, [userId]);
      const reminders = remindersResult.rows;
  
      // ─────────────────────────────────────────────────────────────
      // QUERY 4: BALANCE de cuentas del usuario
      // ─────────────────────────────────────────────────────────────
      const accountsQuery = `
        SELECT COALESCE(SUM(balance), 0) AS total_balance
        FROM accounts
        WHERE user_id = $1
      `;
      const accountsResult = await pool.query(accountsQuery, [userId]);
      const initialBalance = parseFloat(accountsResult.rows[0]?.total_balance || 0);
  
      // ─────────────────────────────────────────────────────────────
      // CÁLCULO DE FEATURES
      // ─────────────────────────────────────────────────────────────
  
      // --- Feature 1: amount ---
      // Ya lo tenemos: amount
  
      // --- Feature 2: category_necessity_score ---
      const categoryNecessityScore = CATEGORY_NECESSITY_MAP[macrocategoria] ?? 50;
  
      // --- Features 3-4: Balance real y ratio ---
      // Balance real = saldo inicial en cuentas + todos los ingresos - todos los gastos anteriores
      const totalPastIncome = pastIncomes.reduce(
        (sum, i) => sum + parseFloat(i.total_amount), 0
      );
      const totalPastExpenses = pastExpenses.reduce(
        (sum, e) => sum + parseFloat(e.total_amount), 0
      );
      // El balance en el momento del gasto (antes de descontar este gasto)
      const balanceAtTime = initialBalance + totalPastIncome - totalPastExpenses;
      const amountToBalanceRatio = balanceAtTime > 0
        ? parseFloat((amount / balanceAtTime).toFixed(4))
        : 99.0; // Si balance es 0 o negativo, ratio muy alto = señal de alerta
  
      // --- Features 5-7: Promedios mensuales (últimos 3 meses) ---
      const threeMonthsAgo = new Date(expenseDate);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
      // Ingresos de los últimos 3 meses agrupados por mes
      const recentIncomes = pastIncomes.filter(
        i => new Date(i.created_at) >= threeMonthsAgo
      );
      const recentExpenses = pastExpenses.filter(
        e => new Date(e.created_at) >= threeMonthsAgo
      );
  
      // Agrupar por mes para calcular promedio mensual real
      const incomeByMonth = {};
      recentIncomes.forEach(i => {
        const monthKey = new Date(i.created_at).toISOString().substring(0, 7); // "YYYY-MM"
        incomeByMonth[monthKey] = (incomeByMonth[monthKey] || 0) + parseFloat(i.total_amount);
      });
      const expenseByMonth = {};
      recentExpenses.forEach(e => {
        const monthKey = new Date(e.created_at).toISOString().substring(0, 7);
        expenseByMonth[monthKey] = (expenseByMonth[monthKey] || 0) + parseFloat(e.total_amount);
      });
  
      const incomeMonthValues = Object.values(incomeByMonth);
      const expenseMonthValues = Object.values(expenseByMonth);
  
      const monthlyIncomeAvg = incomeMonthValues.length > 0
        ? parseFloat((incomeMonthValues.reduce((a, b) => a + b, 0) / incomeMonthValues.length).toFixed(2))
        : 0;
  
      const monthlyExpenseAvg = expenseMonthValues.length > 0
        ? parseFloat((expenseMonthValues.reduce((a, b) => a + b, 0) / expenseMonthValues.length).toFixed(2))
        : 0;
  
      // Tasa de ahorro: (ingresos - gastos) / ingresos
      // Si no hay ingresos registrados, usamos -1 como señal de "sin datos"
      const savingsRate = monthlyIncomeAvg > 0
        ? parseFloat(((monthlyIncomeAvg - monthlyExpenseAvg) / monthlyIncomeAvg).toFixed(4))
        : -1;
  
      // --- Features 8-10: Recordatorios ---
      const today = new Date(expenseDate);
      today.setHours(0, 0, 0, 0);
  
      const sevenDaysLater = new Date(today);
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
      // Suma de pagos en los próximos 7 días
      const upcomingRemindersAmount = reminders
        .filter(r => {
          const dueDate = new Date(r.next_payment_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= today && dueDate <= sevenDaysLater;
        })
        .reduce((sum, r) => sum + parseFloat(r.total_amount), 0);
  
      // Cantidad de pagos vencidos (fecha pasada)
      const overdueRemindersCount = reminders.filter(r => {
        const dueDate = new Date(r.next_payment_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;
  
      // Ratio: cuánto representan los pagos próximos sobre el balance actual
      const remindersToBalanceRatio = balanceAtTime > 0
        ? parseFloat((upcomingRemindersAmount / balanceAtTime).toFixed(4))
        : 99.0;
  
      // --- Features 11-14: Temporales ---
      const dayOfMonth = expenseDate.getDate();                // 1-31
      const dayOfWeek = expenseDate.getDay();                  // 0=Dom, 6=Sab
      const daysInMonth = new Date(
        expenseDate.getFullYear(),
        expenseDate.getMonth() + 1,
        0
      ).getDate();
      const daysToEndOfMonth = daysInMonth - dayOfMonth;       // 0-30
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;    // true/false
  
      // --- Features 15-18: Historial de la categoría ---
      // Solo gastos de la misma macrocategoría
      const sameCategoryExpenses = pastExpenses.filter(
        e => e.macrocategoria === macrocategoria
      );
  
      const timesBoughtThisCategory = sameCategoryExpenses.length;
  
      const avgAmountThisCategory = timesBoughtThisCategory > 0
        ? parseFloat((
            sameCategoryExpenses.reduce((sum, e) => sum + parseFloat(e.total_amount), 0)
            / timesBoughtThisCategory
          ).toFixed(2))
        : 0;
  
      // Cuánto se desvía este gasto del promedio de su categoría
      // 1.0 = igual al promedio, 2.0 = el doble, 0.5 = la mitad
      const amountVsCategoryAvg = avgAmountThisCategory > 0
        ? parseFloat((amount / avgAmountThisCategory).toFixed(4))
        : 1.0; // Sin historial, asumimos que es "normal"
  
      // Días desde el último gasto en esta categoría
      let daysSinceLastSameCategory = -1; // -1 = nunca ha gastado en esta categoría
      if (sameCategoryExpenses.length > 0) {
        // El array ya viene ordenado por created_at DESC, el primero es el más reciente
        const lastDate = new Date(sameCategoryExpenses[0].created_at);
        const diffMs = expenseDate.getTime() - lastDate.getTime();
        daysSinceLastSameCategory = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
  
      // ─────────────────────────────────────────────────────────────
      // INSERTAR EN LA BASE DE DATOS
      // ─────────────────────────────────────────────────────────────
      const insertQuery = `
        INSERT INTO expense_ml_features (
          expense_id,
          user_id,
          macrocategoria,
          categoria,
          amount,
          category_necessity_score,
          balance_at_time,
          amount_to_balance_ratio,
          monthly_income_avg,
          monthly_expense_avg,
          savings_rate,
          upcoming_reminders_amount,
          overdue_reminders_count,
          reminders_to_balance_ratio,
          day_of_month,
          day_of_week,
          days_to_end_of_month,
          is_weekend,
          times_bought_this_category,
          avg_amount_this_category,
          amount_vs_category_avg,
          days_since_last_same_category
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22
        )
        ON CONFLICT (expense_id) 
        DO UPDATE SET
          macrocategoria              = EXCLUDED.macrocategoria,
          categoria                   = EXCLUDED.categoria,
          amount                      = EXCLUDED.amount,
          category_necessity_score    = EXCLUDED.category_necessity_score,
          balance_at_time             = EXCLUDED.balance_at_time,
          amount_to_balance_ratio     = EXCLUDED.amount_to_balance_ratio,
          monthly_income_avg          = EXCLUDED.monthly_income_avg,
          monthly_expense_avg         = EXCLUDED.monthly_expense_avg,
          savings_rate                = EXCLUDED.savings_rate,
          upcoming_reminders_amount   = EXCLUDED.upcoming_reminders_amount,
          overdue_reminders_count     = EXCLUDED.overdue_reminders_count,
          reminders_to_balance_ratio  = EXCLUDED.reminders_to_balance_ratio,
          day_of_month                = EXCLUDED.day_of_month,
          day_of_week                 = EXCLUDED.day_of_week,
          days_to_end_of_month        = EXCLUDED.days_to_end_of_month,
          is_weekend                  = EXCLUDED.is_weekend,
          times_bought_this_category  = EXCLUDED.times_bought_this_category,
          avg_amount_this_category    = EXCLUDED.avg_amount_this_category,
          amount_vs_category_avg      = EXCLUDED.amount_vs_category_avg,
          days_since_last_same_category = EXCLUDED.days_since_last_same_category,
          updated_at                  = NOW()
        RETURNING feature_id
      `;
  
      const values = [
        expenseId,                   // $1
        userId,                      // $2
        macrocategoria,              // $3
        categoria,                   // $4
        amount,                      // $5
        categoryNecessityScore,      // $6
        balanceAtTime,               // $7
        amountToBalanceRatio,        // $8
        monthlyIncomeAvg,            // $9
        monthlyExpenseAvg,           // $10
        savingsRate,                 // $11
        upcomingRemindersAmount,     // $12
        overdueRemindersCount,       // $13
        remindersToBalanceRatio,     // $14
        dayOfMonth,                  // $15
        dayOfWeek,                   // $16
        daysToEndOfMonth,            // $17
        isWeekend,                   // $18
        timesBoughtThisCategory,     // $19
        avgAmountThisCategory,       // $20
        amountVsCategoryAvg,         // $21
        daysSinceLastSameCategory,   // $22
      ];
  
      const insertResult = await pool.query(insertQuery, values);
      const featureId = insertResult.rows[0]?.feature_id;
  
      // Log resumen de lo calculado (útil para debugging)
      console.log(`✅ [ML] Features guardados (feature_id: ${featureId})`);
      console.log(`   💰 Monto: $${amount} | Balance: $${balanceAtTime.toFixed(2)} | Ratio: ${(amountToBalanceRatio * 100).toFixed(1)}%`);
      console.log(`   📅 Día ${dayOfMonth} del mes | ${daysToEndOfMonth} días para fin de mes | Fin de semana: ${isWeekend}`);
      console.log(`   🔔 Recordatorios próximos: $${upcomingRemindersAmount} | Vencidos: ${overdueRemindersCount}`);
      console.log(`   📊 Categoría: "${macrocategoria}" | Necesidad: ${categoryNecessityScore}/100 | Frecuencia: ${timesBoughtThisCategory}x`);
      console.log(`   📈 Promedio categoría: $${avgAmountThisCategory} | Ratio vs promedio: ${amountVsCategoryAvg}x`);
      console.log(`   💹 Ingreso mensual prom: $${monthlyIncomeAvg} | Gasto mensual prom: $${monthlyExpenseAvg} | Ahorro: ${(savingsRate * 100).toFixed(1)}%`);
  
      return featureId;
  
    } catch (error) {
      // IMPORTANTE: Nunca lanzar el error hacia arriba.
      // Si falla el cálculo de features, el gasto ya fue guardado
      // y no queremos que eso afecte la experiencia del usuario.
      console.error(`❌ [ML] Error calculando features para gasto ${expenseId}:`, error.message);
      return null;
    }
  }
  
  export { calculateAndSaveMLFeatures };