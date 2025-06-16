import React, { useState, useEffect } from "react";
import "./ImpuestoHerenciasCalculator.css";

import { 
  Button, 
  Card, 
  Input, 
  Label, 
  Switch,
  Text,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow
} from "@fluentui/react-components";

// Componente principal de la calculadora de impuesto a las herencias
export function ImpuestoHerenciasCalculator({ state, updateState }) {
  // Formateo de moneda con precisión para impuestos
  const formatearImpuestoPreciso = (valor) => {
    const valorNumerico = typeof valor === 'number' ? valor : parseFloat(valor);
    
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valorNumerico);
  };

  // Formateo para porcentajes
  const formatearFactor = (factor) => {
    return (factor * 100).toFixed(1) + "%";
  };

  // Valores UTM por año y mes (valores ficticios, deben actualizarse con datos reales)
  const valoresUTM = {
    "2020": {
      "01": 49673, "02": 49723, "03": 50021, "04": 50221, 
      "05": 50372, "06": 50372, "07": 50322, "08": 50272, 
      "09": 50322, "10": 50372, "11": 50674, "12": 51029
    },
    "2021": {
      "01": 50978, "02": 51131, "03": 51489, "04": 51592, 
      "05": 51798, "06": 52005, "07": 52161, "08": 52213, 
      "09": 52631, "10": 52842, "11": 53476, "12": 54171
    },
    "2022": {
      "01": 54442, "02": 54878, "03": 55537, "04": 55704, 
      "05": 56762, "06": 57557, "07": 58248, "08": 58772, 
      "09": 59595, "10": 60310, "11": 60853, "12": 61157
    },
    "2023": {
      "01": 61769, "02": 61954, "03": 62450, "04": 62388, 
      "05": 63074, "06": 63263, "07": 63326, "08": 63199, 
      "09": 63452, "10": 63515, "11": 63960, "12": 64216
    },
    "2024": {
      "01": 64666, "02": 64343, "03": 64793, "04": 65182, 
      "05": 65443, "06": 65770, "07": 65967, "08": 65901, 
      "09": 66362, "10": 66561, "11": 66628, "12": 67294
    },
    "2025": {
      "01": 67429, "02": 67294, "03": 68034
    }
  };

  // Tramos de impuesto en UTM según la normativa
  const tramosImpuestoUTM = [
    { desde: 0, hasta: 960, factor: 0.01, rebaja: 0 },
    { desde: 960, hasta: 1920, factor: 0.025, rebaja: 14.4 },
    { desde: 1920, hasta: 3840, factor: 0.05, rebaja: 62.4 },
    { desde: 3840, hasta: 5760, factor: 0.075, rebaja: 158.4 },
    { desde: 5760, hasta: 7680, factor: 0.10, rebaja: 302.4 },
    { desde: 7680, hasta: 9600, factor: 0.15, rebaja: 686.4 },
    { desde: 9600, hasta: 14400, factor: 0.20, rebaja: 1166.4 },
    { desde: 14400, hasta: 999999, factor: 0.25, rebaja: 1886.4 }
  ];

  // Tipos de parentescos con sus exenciones y recargos
  const opcionesParentesco = [
    { value: "hijo", label: "Hijo", exencion: 600, recargo: 0 },
    { value: "conyuge", label: "Cónyuge", exencion: 600, recargo: 0 },
    { value: "ascendiente", label: "Ascendiente", exencion: 600, recargo: 0 },
    { value: "hermano", label: "Hermano", exencion: 60, recargo: 0.2 },
    { value: "medio_hermano", label: "Medio Hermano", exencion: 60, recargo: 0.2 },
    { value: "colateral3_4", label: "Colateral 3° o 4° grado", exencion: 60, recargo: 0.2 },
    { value: "colateral5_6", label: "Colateral 5° o 6° grado", exencion: 0, recargo: 0.4 }
  ];

  // Extraer estados del estado global
  const {
    etiqueta,
    mostrarTablaReferencia,
    calculosRealizados,
    error,
    celdasExpandidas,
    selectedYearFallecimiento,
    selectedMonthFallecimiento,
    selectedYearPago,
    selectedMonthPago,
    valorUTMFallecimiento,
    valorUTMPago,
    masaHereditaria,
    herederos
  } = state;
  
  // Función para actualizar un estado específico
  const updateStateValue = (key, value) => {
    updateState({ [key]: value });
  };
  
  // Meses para el dropdown
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];
  
  // Obtener años disponibles en los valores UTM
  const availableYears = Object.keys(valoresUTM).sort((a, b) => b - a); // Orden descendente
  
  // Función para expandir/contraer celdas en la tabla de resultados
  const toggleExpansion = (id, columna) => {
    updateStateValue("celdasExpandidas", {
      ...celdasExpandidas,
      [`${id}-${columna}`]: !celdasExpandidas[`${id}-${columna}`]
    });
  };

  // Formateo de moneda
  const formatearMoneda = (valor, conDecimales = false) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: conDecimales ? 2 : 0,
      minimumFractionDigits: conDecimales ? 2 : 0,
    }).format(valor);
  };
  
  // Formateo para valores UTM (con todos los decimales - para cálculos)
  const formatearUTM = (valor) => {
    return new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 6,
      minimumFractionDigits: 3,
    }).format(valor);
  };
  
  // Formateo para valores UTM (solo para visualización en la tabla de resultados)
  const formatearUTMResultado = (valor) => {
    return new Intl.NumberFormat("es-CL", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 1,
    }).format(valor);
  };

  // Obtener clase para celdas expandibles
  const getCeldaStyle = (id, columna) => {
    const key = `${id}-${columna}`;
    const isExpanded = celdasExpandidas[key];
    
    return isExpanded ? "celda-expandida" : "celda-normal";
  };
  
  // Obtener el valor de UTM para la fecha de fallecimiento
  const getValorUTMFallecimiento = () => {
    try {
      // Verificar si existe el año y mes seleccionados
      if (valoresUTM[selectedYearFallecimiento] && valoresUTM[selectedYearFallecimiento][selectedMonthFallecimiento]) {
        const valorUTM = valoresUTM[selectedYearFallecimiento][selectedMonthFallecimiento];
        
        updateStateValue("valorUTMFallecimiento", valorUTM);
        
        return valorUTM;
      }
      // Si no existe, mostrar error
      updateStateValue("error", `No hay valor UTM disponible para ${months.find(m => m.value === selectedMonthFallecimiento)?.label} de ${selectedYearFallecimiento}`);
      return null;
    } catch (err) {
      console.error("Error al obtener valor UTM:", err);
      updateStateValue("error", "Error al obtener valores tributarios");
      return null;
    }
  };

  // Obtener el valor de UTM para la fecha de pago
  const getValorUTMPago = () => {
    try {
      // Verificar si existe el año y mes seleccionados
      if (valoresUTM[selectedYearPago] && valoresUTM[selectedYearPago][selectedMonthPago]) {
        const valorUTM = valoresUTM[selectedYearPago][selectedMonthPago];
        
        updateStateValue("valorUTMPago", valorUTM);
        
        return valorUTM;
      }
      // Si no existe, mostrar error
      updateStateValue("error", `No hay valor UTM disponible para ${months.find(m => m.value === selectedMonthPago)?.label} de ${selectedYearPago}`);
      return null;
    } catch (err) {
      console.error("Error al obtener valor UTM:", err);
      updateStateValue("error", "Error al obtener valores tributarios");
      return null;
    }
  };

  // Convertir la tabla de tramos a pesos
  const convertirTablaUTMaPesos = () => {
    if (!valorUTMFallecimiento) return [];
    
    return tramosImpuestoUTM.map(tramo => {
      return {
        ...tramo,
        desdePesos: tramo.desde * valorUTMFallecimiento,
        hastaPesos: tramo.hasta === 999999 ? Infinity : tramo.hasta * valorUTMFallecimiento,
        rebajaPesos: tramo.rebaja * valorUTMFallecimiento
      };
    });
  };

  // Obtener la tabla en pesos para visualización
  const tramosPesos = valorUTMFallecimiento ? convertirTablaUTMaPesos() : [];

  // Manejar cambio en el monto
  const handleMonedaChange = (e, key) => {
    let valorInput = e.target.value;
    
    if (valorInput === "") {
      updateStateValue(key, "");
      return;
    }
    
    // Eliminar caracteres no numéricos
    const valorLimpio = valorInput.replace(/\D/g, "");
    
    if (valorLimpio === "") {
      updateStateValue(key, "");
      return;
    }
    
    try {
      const valorNumerico = parseInt(valorLimpio, 10);
      
      if (!isNaN(valorNumerico)) {
        // Formatear con separadores de miles
        const valorFormateado = new Intl.NumberFormat("es-CL", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0
        }).format(valorNumerico);
        
        updateStateValue(key, valorFormateado);
      } else {
        updateStateValue(key, valorLimpio);
      }
    } catch (err) {
      console.error("Error al formatear:", err);
      updateStateValue(key, valorLimpio);
    }
    
    updateStateValue("error", "");
  };

  // Manejar cambio en la masa hereditaria
  const handleMasaHereditariaChange = (e) => {
    handleMonedaChange(e, "masaHereditaria");
  };

  // Manejar cambio en los herederos
  const handleHerederoChange = (index, field, value) => {
    const nuevosHerederos = [...herederos];
    nuevosHerederos[index] = {
      ...nuevosHerederos[index],
      [field]: value
    };
    updateStateValue("herederos", nuevosHerederos);
  };

  // Agregar un nuevo heredero
  const agregarHeredero = () => {
    const nuevoHeredero = {
      id: Date.now(),
      nombre: "",
      parentesco: ""
    };
    updateStateValue("herederos", [...herederos, nuevoHeredero]);
  };

  // Eliminar un heredero
  const eliminarHeredero = (id) => {
    updateStateValue("herederos", herederos.filter(h => h.id !== id));
  };

  // Calcular las asignaciones para cada heredero
  const calcularAsignaciones = () => {
    if (!masaHereditaria || !valorUTMFallecimiento || !valorUTMPago) {
      updateStateValue("error", "Por favor ingrese la masa hereditaria y seleccione fechas válidas");
      return false;
    }

    if (herederos.length === 0) {
      updateStateValue("error", "Por favor ingrese al menos un heredero");
      return false;
    }

    // Verificar que todos los herederos tengan nombre y parentesco
    for (const heredero of herederos) {
      if (!heredero.nombre || !heredero.parentesco) {
        updateStateValue("error", "Todos los herederos deben tener nombre y parentesco");
        return false;
      }
    }

    try {
      // Convertir masa hereditaria a número y luego a UTM (conservando todos los decimales)
      const masaHereditariaNum = parseInt(masaHereditaria.replace(/\D/g, ""));
      
      if (isNaN(masaHereditariaNum) || masaHereditariaNum <= 0) {
        updateStateValue("error", "La masa hereditaria debe ser un valor positivo");
        return false;
      }

      // Convertir a UTM con todos los decimales
      const masaHereditariaUTM = masaHereditariaNum / valorUTMFallecimiento;

      // Clasificar herederos por tipo para calcular asignaciones
      const hijos = herederos.filter(h => opcionesParentesco.find(p => p.value === h.parentesco)?.label.includes("Hijo"));
      const conyuge = herederos.find(h => h.parentesco === "conyuge");
      const ascendientes = herederos.filter(h => h.parentesco === "ascendiente");
      const hermanos = herederos.filter(h => h.parentesco === "hermano");
      const medioHermanos = herederos.filter(h => h.parentesco === "medio_hermano");
      const colaterales34 = herederos.filter(h => h.parentesco === "colateral3_4");
      const colaterales56 = herederos.filter(h => h.parentesco === "colateral5_6");

      // Crear copia de herederos para asignar montos
      const herederosConAsignaciones = [...herederos];

      // Calcular asignaciones según las reglas de cálculo (ahora en UTM)
      if (hijos.length > 0) {
        // Caso 1: Solo hijos
        if (!conyuge && hijos.length > 0) {
          const asignacionPorHijo = masaHereditariaUTM / hijos.length;
          hijos.forEach(hijo => {
            const index = herederosConAsignaciones.findIndex(h => h.id === hijo.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionPorHijo;
            }
          });
        }
        // Caso 2: 1 hijo y cónyuge
        else if (conyuge && hijos.length === 1) {
          const asignacion = masaHereditariaUTM / 2;
          const indexHijo = herederosConAsignaciones.findIndex(h => h.id === hijos[0].id);
          const indexConyuge = herederosConAsignaciones.findIndex(h => h.id === conyuge.id);
          
          if (indexHijo !== -1) {
            herederosConAsignaciones[indexHijo].asignacionUTM = asignacion;
          }
          if (indexConyuge !== -1) {
            herederosConAsignaciones[indexConyuge].asignacionUTM = asignacion;
          }
        }
        // Caso 3: Más de 1 hijo (menos de 7) y cónyuge
        else if (conyuge && hijos.length > 1 && hijos.length < 7) {
          const factor = hijos.length + 2;
          const asignacionPorHijo = masaHereditariaUTM / factor;
          const asignacionConyuge = 2 * asignacionPorHijo;
          
          hijos.forEach(hijo => {
            const index = herederosConAsignaciones.findIndex(h => h.id === hijo.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionPorHijo;
            }
          });
          
          const indexConyuge = herederosConAsignaciones.findIndex(h => h.id === conyuge.id);
          if (indexConyuge !== -1) {
            herederosConAsignaciones[indexConyuge].asignacionUTM = asignacionConyuge;
          }
        }
        // Caso 4: Más de 7 hijos y cónyuge
        else if (conyuge && hijos.length >= 7) {
          const asignacionConyuge = masaHereditariaUTM / 4;
          const restante = masaHereditariaUTM - asignacionConyuge;
          const asignacionPorHijo = restante / hijos.length;
          
          hijos.forEach(hijo => {
            const index = herederosConAsignaciones.findIndex(h => h.id === hijo.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionPorHijo;
            }
          });
          
          const indexConyuge = herederosConAsignaciones.findIndex(h => h.id === conyuge.id);
          if (indexConyuge !== -1) {
            herederosConAsignaciones[indexConyuge].asignacionUTM = asignacionConyuge;
          }
        }
      }
      // Caso 5: Cónyuge y ascendientes
      else if (conyuge && ascendientes.length > 0) {
        const asignacionConyuge = (masaHereditariaUTM * 2) / 3;
        const restante = masaHereditariaUTM - asignacionConyuge;
        const asignacionPorAscendiente = restante / ascendientes.length;
        
        ascendientes.forEach(ascendiente => {
          const index = herederosConAsignaciones.findIndex(h => h.id === ascendiente.id);
          if (index !== -1) {
            herederosConAsignaciones[index].asignacionUTM = asignacionPorAscendiente;
          }
        });
        
        const indexConyuge = herederosConAsignaciones.findIndex(h => h.id === conyuge.id);
        if (indexConyuge !== -1) {
          herederosConAsignaciones[indexConyuge].asignacionUTM = asignacionConyuge;
        }
      }
      // Caso 6: Solo cónyuge
      else if (conyuge && !hijos.length && !ascendientes.length) {
        const indexConyuge = herederosConAsignaciones.findIndex(h => h.id === conyuge.id);
        if (indexConyuge !== -1) {
          herederosConAsignaciones[indexConyuge].asignacionUTM = masaHereditariaUTM;
        }
      }
      // Caso 7: Solo ascendientes
      else if (ascendientes.length > 0) {
        const asignacionPorAscendiente = masaHereditariaUTM / ascendientes.length;
        
        ascendientes.forEach(ascendiente => {
          const index = herederosConAsignaciones.findIndex(h => h.id === ascendiente.id);
          if (index !== -1) {
            herederosConAsignaciones[index].asignacionUTM = asignacionPorAscendiente;
          }
        });
      }
      // Caso 8: Hermanos y medio hermanos
      else if (hermanos.length > 0 || medioHermanos.length > 0) {
        // Si hay hermanos y medio hermanos, a los hermanos les corresponde el doble
        if (hermanos.length > 0 && medioHermanos.length > 0) {
          const factor = (2 * hermanos.length) + medioHermanos.length;
          const asignacionBase = masaHereditariaUTM / factor;
          
          hermanos.forEach(hermano => {
            const index = herederosConAsignaciones.findIndex(h => h.id === hermano.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = 2 * asignacionBase;
            }
          });
          
          medioHermanos.forEach(medioHermano => {
            const index = herederosConAsignaciones.findIndex(h => h.id === medioHermano.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionBase;
            }
          });
        }
        // Solo hermanos
        else if (hermanos.length > 0) {
          const asignacionPorHermano = masaHereditariaUTM / hermanos.length;
          
          hermanos.forEach(hermano => {
            const index = herederosConAsignaciones.findIndex(h => h.id === hermano.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionPorHermano;
            }
          });
        }
        // Solo medio hermanos
        else if (medioHermanos.length > 0) {
          const asignacionPorMedioHermano = masaHereditariaUTM / medioHermanos.length;
          
          medioHermanos.forEach(medioHermano => {
            const index = herederosConAsignaciones.findIndex(h => h.id === medioHermano.id);
            if (index !== -1) {
              herederosConAsignaciones[index].asignacionUTM = asignacionPorMedioHermano;
            }
          });
        }
      }
      // Caso 9: Colaterales 3° y 4° grado
      else if (colaterales34.length > 0) {
        const asignacionPorColateral = masaHereditariaUTM / colaterales34.length;
        
        colaterales34.forEach(colateral => {
          const index = herederosConAsignaciones.findIndex(h => h.id === colateral.id);
          if (index !== -1) {
            herederosConAsignaciones[index].asignacionUTM = asignacionPorColateral;
          }
        });
      }
      // Caso 10: Colaterales 5° y 6° grado
      else if (colaterales56.length > 0) {
        const asignacionPorColateral = masaHereditariaUTM / colaterales56.length;
        
        colaterales56.forEach(colateral => {
          const index = herederosConAsignaciones.findIndex(h => h.id === colateral.id);
          if (index !== -1) {
            herederosConAsignaciones[index].asignacionUTM = asignacionPorColateral;
          }
        });
      }

      // Para cada heredero, calcular también la asignación en pesos (solo para visualización)
      herederosConAsignaciones.forEach((heredero, index) => {
        if (heredero.asignacionUTM) {
          herederosConAsignaciones[index].asignacion = heredero.asignacionUTM * valorUTMFallecimiento;
        }
      });

      // Actualizar el estado con las asignaciones calculadas
      updateStateValue("herederos", herederosConAsignaciones);
      return true;
    } catch (err) {
      console.error("Error al calcular asignaciones:", err);
      updateStateValue("error", "Error al calcular las asignaciones de los herederos");
      return false;
    }
  };

  // Calcular impuesto para cada heredero
  const calcularImpuestoHerederos = () => {
    if (!calcularAsignaciones()) {
      return;
    }

    try {
      // Convertir a número la masa hereditaria
      const masaHereditariaNum = parseInt(masaHereditaria.replace(/\D/g, ""));
      // Convertir a UTM
      const masaHereditariaUTM = masaHereditariaNum / valorUTMFallecimiento;
      
      // Crear copia de herederos para calcular impuestos
      const herederosConImpuestos = [...herederos].map(heredero => {
        // Obtener información de parentesco
        const infoParentesco = opcionesParentesco.find(p => p.value === heredero.parentesco);
        if (!infoParentesco) {
          return { ...heredero, impuestoTotalUTM: 0, impuestoTotal: 0, exento: true };
        }

        // Tomar la asignación ya calculada en UTM
        const asignacionUTM = heredero.asignacionUTM;
        
        // Aplicar exención por parentesco
        const exencionUTM = infoParentesco.exencion;
        const baseImponibleUTM = Math.max(0, asignacionUTM - exencionUTM);
        
        // Si la base imponible es 0, está exento
        if (baseImponibleUTM <= 0) {
          return {
            ...heredero,
            exencionUTM,
            baseImponibleUTM: 0,
            tramo: null,
            impuestoBaseUTM: 0,
            recargoUTM: 0,
            impuestoTotalUTM: 0,
            impuestoTotal: 0,
            exento: true
          };
        }

        // Encontrar el tramo correspondiente
        const tramo = tramosImpuestoUTM.find(
          t => baseImponibleUTM > t.desde && baseImponibleUTM <= t.hasta
        ) || tramosImpuestoUTM[0];
        
        // Calcular impuesto base en UTM
        const impuestoBaseUTM = (baseImponibleUTM * tramo.factor) - tramo.rebaja;
        
        // Aplicar recargo según parentesco
        const recargoUTM = impuestoBaseUTM * infoParentesco.recargo;
        
        // Calcular impuesto total en UTM
        const impuestoTotalUTM = impuestoBaseUTM + recargoUTM;
        
        // Calcular impuesto total en pesos (usando la UTM de la fecha de pago)
        const impuestoTotal = impuestoTotalUTM * valorUTMPago;

        return {
          ...heredero,
          exencionUTM,
          baseImponibleUTM,
          tramo,
          impuestoBaseUTM,
          recargoUTM,
          impuestoTotalUTM,
          impuestoTotal,
          exento: false
        };
      });

      // Crear un nuevo cálculo para agregar a los resultados
      const nuevoCalculo = {
        id: Date.now(),
        etiqueta: etiqueta || `Cálculo ${calculosRealizados.length + 1}`,
        fechaCalculo: new Date().toISOString(),
        masaHereditaria: masaHereditariaNum,
        masaHereditariaUTM,
        valorUTMFallecimiento,
        valorUTMPago,
        fechaFallecimiento: `${months.find(m => m.value === selectedMonthFallecimiento)?.label} ${selectedYearFallecimiento}`,
        fechaPago: `${months.find(m => m.value === selectedMonthPago)?.label} ${selectedYearPago}`,
        herederos: herederosConImpuestos
      };

      // Actualizar la lista de cálculos realizados
      updateStateValue("calculosRealizados", [...calculosRealizados, nuevoCalculo]);
      
      // Limpiar el formulario
      updateStateValue("etiqueta", "");
      updateStateValue("error", "");
      
      return true;
    } catch (err) {
      console.error("Error al calcular impuestos:", err);
      updateStateValue("error", "Error al calcular los impuestos de los herederos");
      return false;
    }
  };

  // Eliminar un cálculo
  const eliminarCalculo = (id) => {
    updateStateValue("calculosRealizados", calculosRealizados.filter(calculo => calculo.id !== id));
  };

  // Limpiar todos los cálculos
  const limpiarCalculos = () => {
    updateStateValue("calculosRealizados", []);
    updateStateValue("etiqueta", "");
    updateStateValue("error", "");
  };

  // Actualizar valores UTM cuando cambien las fechas
  useEffect(() => {
    getValorUTMFallecimiento();
  }, [selectedMonthFallecimiento, selectedYearFallecimiento]);

  useEffect(() => {
    getValorUTMPago();
  }, [selectedMonthPago, selectedYearPago]);

  // Renderizar tabla de referencia
  const renderTablaReferencia = () => {
    return (
      <div className="ref-panel">
        <Card className="card">
          <h4 className="card-title">
            Tabla de Referencia (Pesos)
          </h4>
          
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th className="ref-header-cell">Desde</th>
                  <th className="ref-header-cell">Hasta</th>
                  <th className="ref-header-cell">Factor</th>
                  <th className="ref-header-cell">Rebaja</th>
                </tr>
              </thead>
              <tbody>
                {tramosPesos.map((tramo, index) => {
                  return (
                    <tr key={index}>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(tramo.desdePesos)}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {tramo.hastaPesos === Infinity ? "y más" : formatearMoneda(tramo.hastaPesos)}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {formatearFactor(tramo.factor)}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(tramo.rebajaPesos)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Tabla de exenciones por parentesco */}
          <h4 className="card-title" style={{marginTop: '20px'}}>
            Exenciones por Parentesco
          </h4>
          
          <div className="ref-table-container">
            <table className="ref-table">
              <thead>
                <tr>
                  <th className="ref-header-cell">Parentesco</th>
                  <th className="ref-header-cell">Exención (UTM)</th>
                  <th className="ref-header-cell">Exención (Pesos)</th>
                  <th className="ref-header-cell">Recargo</th>
                </tr>
              </thead>
              <tbody>
                {opcionesParentesco.map((opcion, index) => {
                  return (
                    <tr key={index}>
                      <td className="ref-cell">
                        {opcion.label}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {opcion.exencion}
                      </td>
                      <td className="ref-cell ref-cell-right">
                        {formatearMoneda(opcion.exencion * valorUTMFallecimiento)}
                      </td>
                      <td className="ref-cell ref-cell-center">
                        {formatearFactor(opcion.recargo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{fontSize: '12px', color: '#666', marginTop: '8px', textAlign: 'center'}}>
            Valores calculados con UTM de fallecimiento: {formatearMoneda(valorUTMFallecimiento)} ({months.find(m => m.value === selectedMonthFallecimiento)?.label} {selectedYearFallecimiento})
            <br />
            UTM de pago: {formatearMoneda(valorUTMPago)} ({months.find(m => m.value === selectedMonthPago)?.label} {selectedYearPago})
          </div>
        </Card>
      </div>
    );
  };

  // Renderizado principal
  return (
    <div className="publish-container">
      <div className="header">
        <h2>Calculadora de Impuesto a las Herencias</h2>
      </div>
      
      <div className="options-bar">
        <div className="switch-container switch-table-ref">
          <Text style={{fontSize: '13px'}}>Tabla de referencia</Text>
          <Switch 
            checked={mostrarTablaReferencia} 
            onChange={(e, data) => updateStateValue("mostrarTablaReferencia", data.checked)} 
          />
        </div>
      </div>
      
      <div className="layout">
        {/* Sección de configuración */}
        <div className="config-section">
          {/* Panel izquierdo: Entrada de datos */}
          <div className="input-panel">
            <Card className="card">
              <h3 className="card-title">Datos de la Herencia</h3>
              
              <div className="fieldset">
                <div className="legend">Parámetros de cálculo</div>
                
                <div className="input-container">
                  <div className="input-group">
                    <Label className="input-label" htmlFor="masaHereditaria" weight="semibold">Masa Hereditaria ($)</Label>
                    <Input
                      id="masaHereditaria"
                      value={masaHereditaria}
                      onChange={handleMasaHereditariaChange}
                      placeholder=""
                      appearance="outline"
                    />
                  </div>
                  
                  <div className="input-group">
                    <Label className="input-label" weight="semibold">Fecha de Fallecimiento</Label>
                    <div className="date-container">
                      <select
                        className="dropdown"
                        value={selectedMonthFallecimiento}
                        onChange={(e) => {
                          updateStateValue("selectedMonthFallecimiento", e.target.value);
                          updateStateValue("error", "");
                        }}
                      >
                        {months.map(month => (
                          <option 
                            key={month.value} 
                            value={month.value}
                            disabled={!valoresUTM[selectedYearFallecimiento] || !valoresUTM[selectedYearFallecimiento][month.value]}
                          >
                            {month.label}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        className="dropdown"
                        value={selectedYearFallecimiento}
                        onChange={(e) => {
                          updateStateValue("selectedYearFallecimiento", e.target.value);
                          updateStateValue("error", "");
                          
                          // Asegurar que el mes seleccionado es válido para el nuevo año
                          if (!valoresUTM[e.target.value] || !valoresUTM[e.target.value][selectedMonthFallecimiento]) {
                            // Seleccionar el primer mes disponible para ese año
                            const firstAvailableMonth = Object.keys(valoresUTM[e.target.value])[0];
                            updateStateValue("selectedMonthFallecimiento", firstAvailableMonth);
                          }
                        }}
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                      {valorUTMFallecimiento && (
                        <Text size="small" className="info-box" style={{flex: 1}}>
                          UTM Fallecimiento: {formatearMoneda(valorUTMFallecimiento)}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className="input-group">
                    <Label className="input-label" weight="semibold">Fecha de Pago del Impuesto</Label>
                    <div className="date-container">
                      <select
                        className="dropdown"
                        value={selectedMonthPago}
                        onChange={(e) => {
                          updateStateValue("selectedMonthPago", e.target.value);
                          updateStateValue("error", "");
                        }}
                      >
                        {months.map(month => (
                          <option 
                            key={month.value} 
                            value={month.value}
                            disabled={!valoresUTM[selectedYearPago] || !valoresUTM[selectedYearPago][month.value]}
                          >
                            {month.label}
                          </option>
                        ))}
                      </select>
                      
                      <select
                        className="dropdown"
                        value={selectedYearPago}
                        onChange={(e) => {
                          updateStateValue("selectedYearPago", e.target.value);
                          updateStateValue("error", "");
                          
                          // Asegurar que el mes seleccionado es válido para el nuevo año
                          if (!valoresUTM[e.target.value] || !valoresUTM[e.target.value][selectedMonthPago]) {
                            // Seleccionar el primer mes disponible para ese año
                            const firstAvailableMonth = Object.keys(valoresUTM[e.target.value])[0];
                            updateStateValue("selectedMonthPago", firstAvailableMonth);
                          }
                        }}
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                      {valorUTMPago && (
                        <Text size="small" className="info-box" style={{flex: 1}}>
                          UTM Pago: {formatearMoneda(valorUTMPago)}
                        </Text>
                      )}
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <Label className="input-label" htmlFor="etiqueta" weight="semibold">Etiqueta (opcional)</Label>
                    <Input
                      id="etiqueta"
                      value={etiqueta}
                      onChange={(e) => updateStateValue("etiqueta", e.target.value)}
                      placeholder=""
                      appearance="outline"
                    />
                  </div>
                </div>
              </div>
              
              {/* Sección de herederos */}
              <div className="fieldset">
                <div className="legend">Herederos</div>
                
                <div className="herederos-container">
                  {herederos.map((heredero, index) => (
                    <div className="heredero-item" key={heredero.id}>
                      <div className="heredero-input">
                        <Label className="input-label">Nombre</Label>
                        <Input
                          value={heredero.nombre}
                          onChange={(e) => handleHerederoChange(index, 'nombre', e.target.value)}
                          placeholder="Nombre del heredero"
                          appearance="outline"
                        />
                      </div>
                      <div className="heredero-input">
                        <Label className="input-label">Parentesco</Label>
                        <select
                          className="dropdown"
                          value={heredero.parentesco}
                          onChange={(e) => handleHerederoChange(index, 'parentesco', e.target.value)}
                          style={{width: '100%'}}
                        >
                          <option value="">-- Seleccione parentesco --</option>
                          {opcionesParentesco.map(opcion => (
                            <option key={opcion.value} value={opcion.value}>
                              {opcion.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="heredero-actions">
                        <button className="btn-remove" onClick={() => eliminarHeredero(heredero.id)}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button className="add-heredero-btn" onClick={agregarHeredero}>
                    + Agregar Heredero
                  </button>
                </div>
                
                {error && <Text className="error-text">{error}</Text>}
              </div>
              
              <div className="button-container">
                <Button 
                  appearance="primary" 
                  onClick={calcularImpuestoHerederos}
                  className="button"
                >
                  Calcular
                </Button>
              </div>
              
              <Button 
                appearance="transparent" 
                onClick={() => {
                  alert(`
Cómo se calcula el Impuesto a las Herencias:

1. Se determina la masa hereditaria en pesos y se convierte a UTM usando el valor de la UTM de la fecha de fallecimiento.

2. Se calcula la asignación para cada heredero según su parentesco (en UTM):
   - Si solo hay hijos: Se divide en partes iguales
   - Si hay 1 hijo y cónyuge: 50% para cada uno
   - Si hay 2-6 hijos y cónyuge: Al cónyuge el doble que a cada hijo
   - Si hay 7 o más hijos y cónyuge: Al cónyuge 1/4 y el resto en partes iguales
   - Si hay cónyuge y ascendientes: Al cónyuge 2/3 y el resto entre ascendientes
   - Si solo hay cónyuge: 100% para el cónyuge
   - Si solo hay ascendientes: En partes iguales
   - Si hay hermanos y medio hermanos: A los hermanos el doble que a los medio hermanos
   - Si solo hay hermanos o medio hermanos: En partes iguales
   - Si hay colaterales: En partes iguales entre los del mismo grado

3. Para cada heredero se aplica una exención según su parentesco (en UTM):
   - Hijos, cónyuge, ascendientes: 600 UTM
   - Hermanos, medio hermanos, colaterales 3° o 4°: 60 UTM
   - Colaterales 5° o 6°: 0 UTM

4. Se determina la base imponible: Asignación - Exención (en UTM)

5. Se calcula el impuesto según la tabla progresiva (en UTM):
   - Hasta 960 UTM: 1%
   - Más de 960 hasta 1.920 UTM: 2,5% (menos 14,4 UTM)
   - Más de 1.920 hasta 3.840 UTM: 5% (menos 62,4 UTM)
   - Y así sucesivamente...

6. Se aplica el recargo según parentesco (en UTM):
   - Hijos, cónyuge, ascendientes: 0%
   - Hermanos, medio hermanos, colaterales 3° o 4°: 20%
   - Colaterales 5° o 6°: 40%

7. El impuesto final en UTM es: Impuesto base + Recargo

8. Se convierte el impuesto final a pesos multiplicando por el valor de la UTM de la fecha de pago.
                  `);
                }}
                className="info-button"
              >
                <span style={{fontSize: '16px'}}>ⓘ</span> ¿Cómo se calcula el impuesto?
              </Button>
            </Card>
          </div>
          
          {/* Panel derecho: Tabla de referencia (si está activada) */}
          {mostrarTablaReferencia && renderTablaReferencia()}
        </div>
        
        {/* Sección de resultados */}
        <div className="results-section">
          <Card className="card">
            <h3 className="card-title">Resultados</h3>
            
            <div className="table-container">
              {calculosRealizados.length > 0 ? (
                <div style={{overflowX: 'auto', width: '100%'}}>
                  {calculosRealizados.map((calculo) => (
                    <div key={calculo.id} style={{marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                        <h4 style={{margin: 0}}>{calculo.etiqueta}</h4>
                        <div>
                          <span style={{marginRight: '15px', fontSize: '14px'}}>
                            Masa Hereditaria: {formatearMoneda(calculo.masaHereditaria)} ({formatearUTM(calculo.masaHereditariaUTM)} UTM)
                          </span>
                          <Button 
                            appearance="subtle"
                            onClick={() => eliminarCalculo(calculo.id)}
                            aria-label="Eliminar cálculo"
                            icon={<span>✕</span>}
                            style={{minWidth: 'auto', height: '24px', padding: '0 8px'}}
                          >
                            <span style={{fontSize: '11px'}}>Eliminar</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div style={{fontSize: '13px', marginBottom: '10px', color: 'var(--text-light)'}}>
                        UTM Fallecimiento ({calculo.fechaFallecimiento}): {formatearMoneda(calculo.valorUTMFallecimiento)} | 
                        UTM Pago ({calculo.fechaPago}): {formatearMoneda(calculo.valorUTMPago)}
                      </div>
                      
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="table-header celda-etiqueta">Heredero</th>
                            <th className="table-header celda-parentesco">Parentesco</th>
                            <th className="table-header celda-asignacion">Asignación (UTM)</th>
                            <th className="table-header celda-exencion">Exención (UTM)</th>
                            <th className="table-header celda-base-imp">Base Imponible (UTM)</th>
                            <th className="table-header celda-factor">Tasa</th>
                            <th className="table-header celda-impuesto-base">Impuesto Base (UTM)</th>
                            <th className="table-header celda-recargo">Recargo (UTM)</th>
                            <th className="table-header celda-resultado-final" style={{fontWeight: 'bold'}}>
                              Impuesto Total ($)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculo.herederos.map((heredero) => (
                            <tr key={heredero.id}>
                              <td className="table-cell celda-etiqueta">
                                <div style={{width: '100%', textAlign: 'center'}}>
                                  <span>
                                    {heredero.nombre}
                                  </span>
                                </div>
                              </td>
                              <td className="table-cell celda-parentesco">
                                {opcionesParentesco.find(p => p.value === heredero.parentesco)?.label || "-"}
                              </td>
                              <td className="table-cell celda-asignacion money-cell-base">
                                {heredero.asignacionUTM ? formatearUTMResultado(heredero.asignacionUTM) : "-"}
                              </td>
                              <td className="table-cell celda-exencion money-cell-base">
                                {heredero.exencionUTM ? formatearUTMResultado(heredero.exencionUTM) : "-"}
                              </td>
                              <td className="table-cell celda-base-imp money-cell-base">
                                {heredero.exento ? "Exento" : formatearUTMResultado(heredero.baseImponibleUTM)}
                              </td>
                              <td className="table-cell celda-factor">
                                {heredero.exento ? "-" : (heredero.tramo ? formatearFactor(heredero.tramo.factor) : "-")}
                              </td>
                              <td className="table-cell celda-impuesto-base money-cell-base">
                                {heredero.exento ? "-" : formatearUTMResultado(heredero.impuestoBaseUTM)}
                              </td>
                              <td className="table-cell celda-recargo money-cell-base">
                                {heredero.exento ? "-" : formatearUTMResultado(heredero.recargoUTM)}
                              </td>
                              <td className="table-cell money-cell-base celda-resultado-final">
                                <div style={{width: '100%'}}>
                                  <span className={heredero.exento ? 'texto-exento' : 'texto-pago'}>
                                    {heredero.exento ? "Exento" : formatearMoneda(Math.round(heredero.impuestoTotal))}
                                    {!heredero.exento && (
                                      <span className="indicador-resultado indicador-pago">
                                        A PAGAR
                                      </span>
                                    )}
                                  </span>
                                  {!heredero.exento && 
                                    <div style={{fontSize: '10px', marginTop: '2px'}}>
                                      ({formatearUTMResultado(heredero.impuestoTotalUTM)} UTM)
                                    </div>
                                  }
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan="8" className="table-cell" style={{textAlign: 'right', fontWeight: 'bold'}}>
                              TOTAL:
                            </td>
                            <td className="table-cell money-cell-base celda-resultado-final">
                              {formatearMoneda(
                                Math.round(calculo.herederos.reduce((sum, h) => sum + (h.impuestoTotal || 0), 0))
                              )}
                              <div style={{fontSize: '10px', marginTop: '2px'}}>
                                ({formatearUTMResultado(
                                  calculo.herederos.reduce((sum, h) => sum + (h.impuestoTotalUTM || 0), 0)
                                )} UTM)
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Text>No hay cálculos realizados. Ingrese los datos de la herencia para comenzar.</Text>
                </div>
              )}
            </div>
            
            {calculosRealizados.length > 0 && (
              <div className="footer-action">
                <Button 
                  appearance="outline"
                  onClick={limpiarCalculos}
                  style={{
                    borderColor: '#0078d4',
                    color: '#0078d4',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  Limpiar Todo
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}