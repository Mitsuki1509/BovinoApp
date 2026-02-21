import AnimalController from '../src/controllers/animalController.js';

describe('AnimalController - validarEdadParaMonta', () => {
    it('debería retornar true para un macho mayor de 18 meses', () => {
        // Generar fecha de hace 20 meses
        const fechaNacimiento = new Date();
        fechaNacimiento.setMonth(fechaNacimiento.getMonth() - 20);

        const resultado = AnimalController.validarEdadParaMonta(fechaNacimiento, 'M');
        expect(resultado).toBe(true);
    });

    it('debería retornar false para un macho menor de 18 meses', () => {
        // Generar fecha de hace 10 meses
        const fechaNacimiento = new Date();
        fechaNacimiento.setMonth(fechaNacimiento.getMonth() - 10);

        const resultado = AnimalController.validarEdadParaMonta(fechaNacimiento, 'M');
        expect(resultado).toBe(false);
    });

    it('debería retornar true para una hembra mayor de 15 meses', () => {
        // Generar fecha de hace 16 meses
        const fechaNacimiento = new Date();
        fechaNacimiento.setMonth(fechaNacimiento.getMonth() - 16);

        const resultado = AnimalController.validarEdadParaMonta(fechaNacimiento, 'H');
        expect(resultado).toBe(true);
    });

    it('debería retornar false para una hembra menor de 15 meses', () => {
        // Generar fecha de hace 10 meses
        const fechaNacimiento = new Date();
        fechaNacimiento.setMonth(fechaNacimiento.getMonth() - 10);

        const resultado = AnimalController.validarEdadParaMonta(fechaNacimiento, 'H');
        expect(resultado).toBe(false);
    });
});
