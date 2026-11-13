<?php
declare(strict_types=1);

// Smoke de regras puras. Não toca banco/arquivos/serviços externos.
// php hostinger/tests/smoke.php
if (PHP_SAPI !== 'cli') exit(1);

require_once __DIR__ . '/../admin.php';
require_once __DIR__ . '/../applications.php';

$assertions = [
    'CPF válido' => ajn_valid_cpf('529.982.247-25') === true,
    'CPF inválido' => ajn_valid_cpf('529.982.247-26') === false,
    'CPF repetido' => ajn_valid_cpf('111.111.111-11') === false,
    'CPF curto' => ajn_valid_cpf('123') === false,
];

$job = ajn_validate_job([
    'title' => 'Técnico de Segurança do Trabalho',
    'slug' => 'tecnico-seguranca-staging',
    'department' => 'SST',
    'location' => 'Belo Horizonte',
    'employmentType' => 'CLT',
    'experienceLevel' => 'Pleno',
    'description' => 'Atuação em campo',
    'requirements' => ['Técnico em Segurança do Trabalho', 'NR-10'],
    'status' => 'draft',
    'openingsCount' => 1,
    'salaryIsDisclosed' => false,
]);
$assertions['Campos camelCase convertidos'] = ($job['employment_type'] ?? '') === 'CLT';
$assertions['Requisitos serializados'] = json_decode($job['requirements'] ?? '', true) === ['Técnico em Segurança do Trabalho', 'NR-10'];
$assertions['Vaga criada em rascunho'] = ($job['status'] ?? '') === 'draft';
$assertions['Visibilidade salarial false'] = ($job['salary_is_disclosed'] ?? null) === 0;

foreach ($assertions as $name => $pass) {
    fwrite($pass ? STDOUT : STDERR, ($pass ? 'PASS' : 'FAIL') . ' — ' . $name . "\n");
}
if (in_array(false, $assertions, true)) exit(1);
fwrite(STDOUT, count($assertions) . " asserts locais PASS. Banco, HTTP e hospedagem ainda não homologados.\n");
