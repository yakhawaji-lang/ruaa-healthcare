// Maps a service slug to its banner photo (brand assets in /public/img/services).
// Falls back to a generic image if a slug has no dedicated photo.
const serviceImages = {
  'medical-supervision': '/img/services/medical-supervision.jpg',
  'healing-care': '/img/services/healing-care.jpg',
  'diagnostic-laboratory-tests': '/img/services/diagnostic-laboratory-tests.jpg',
  'chronic-disease-care': '/img/services/chronic-disease-care.jpg',
  'medication-management': '/img/services/medication-management.jpg',
  'nutritional-care': '/img/services/nutritional-care.jpg',
  'pain-treatment': '/img/services/pain-treatment.jpg',
  'palliative-care': '/img/services/palliative-care.jpg',
  'patient-and-family-education': '/img/services/patient-and-family-education.jpg',
  'physical-and-occupational-therapy-and-rehabilitation': '/img/services/physical-and-occupational-therapy-and-rehabilitation.jpg',
  'integrated-nursing-services': '/img/services/integrated-nursing-services.jpg',
  'wound-burn-and-bed-ulcer-care': '/img/services/wound-burn-and-bed-ulcer-care.jpg',
  'immunization-and-basic-vaccinations': '/img/services/immunization-and-basic-vaccinations.jpg',
  'respiratory-care': '/img/services/respiratory-care.jpg',
};

export function serviceImage(slug) {
  return serviceImages[slug] || '/img/about.jpg';
}

export default serviceImages;
