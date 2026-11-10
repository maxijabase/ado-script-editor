const words = (type, list) => list.split(/\s+/).filter(Boolean).map((label) => ({ label, type }));

// `${name}` marks snippet fields; Tab moves between them.
const vso = (say) => [
  { label: '##vso setvariable', type: 'text', snippet: say(`"##vso[task.setvariable variable=\${name}]\${value}"`) },
  { label: '##vso setvariable (output)', type: 'text', snippet: say(`"##vso[task.setvariable variable=\${name};isOutput=true]\${value}"`) },
  { label: '##vso setvariable (secret)', type: 'text', snippet: say(`"##vso[task.setvariable variable=\${name};issecret=true]\${value}"`) },
  { label: '##vso complete', type: 'text', snippet: say(`"##vso[task.complete result=\${Succeeded};]\${message}"`) },
  { label: '##vso logissue', type: 'text', snippet: say(`"##vso[task.logissue type=\${error};]\${message}"`) },
  { label: '##vso uploadfile', type: 'text', snippet: say(`"##vso[task.uploadfile]\${path}"`) },
  { label: '##vso addbuildtag', type: 'text', snippet: say(`"##vso[build.addbuildtag]\${tag}"`) },
  { label: '##[group]', type: 'text', snippet: `${say('"##[group]${title}"')}\n\${}\n${say('"##[endgroup]"')}` },
  { label: '##[warning]', type: 'text', snippet: say(`"##[warning]\${message}"`) },
  { label: '##[error]', type: 'text', snippet: say(`"##[error]\${message}"`) },
  { label: '##[debug]', type: 'text', snippet: say(`"##[debug]\${message}"`) },
  { label: '##[section]', type: 'text', snippet: say(`"##[section]\${message}"`) },
];

export const languages = {
  powershell: {
    name: 'PowerShell',
    wordChars: '-$',
    completions: [
      ...words('keyword', 'if else elseif foreach for while do until switch function param begin process end try catch finally throw return break continue exit trap filter'),
      ...words('function', `Write-Host Write-Output Write-Error Write-Warning Write-Verbose Write-Debug Write-Information
        Get-Content Set-Content Add-Content Out-File Out-Null Out-String ConvertTo-Json ConvertFrom-Json ConvertTo-SecureString
        Invoke-RestMethod Invoke-WebRequest Invoke-Expression Test-Path New-Item Remove-Item Copy-Item Move-Item Rename-Item
        Get-Item Get-ChildItem Join-Path Split-Path Resolve-Path Select-Object Where-Object ForEach-Object Sort-Object
        Group-Object Measure-Object Compare-Object Select-String Start-Sleep Start-Process Get-Date Get-Random New-Guid
        Set-StrictMode Import-Module Install-Module Get-Module
        Get-AzContext Set-AzContext Get-AzSubscription Get-AzResource Get-AzResourceGroup New-AzResourceGroupDeployment
        Get-AzContainerApp Update-AzContainerApp Get-AzContainerAppRevision Restart-AzContainerAppRevision
        New-AzContainerAppTemplateObject Get-AzKeyVaultSecret Set-AzKeyVaultSecret Get-AzStorageAccount
        Get-AzStorageAccountKey New-AzStorageContext Set-AzStorageBlobContent Get-AzStorageBlob Get-AzWebApp
        Restart-AzWebApp Publish-AzWebApp Get-AzWebAppSlot Switch-AzWebAppSlot Get-AzSqlDatabase Get-AzAccessToken
        Get-AzRoleAssignment New-AzRoleAssignment Get-AzADServicePrincipal Get-AzADGroup`),
      ...words('variable', '$true $false $null $_ $PSItem $env: $ErrorActionPreference $LASTEXITCODE $PSScriptRoot $args'),
      ...vso((t) => `Write-Host ${t}`),
    ],
  },
  shell: {
    name: 'Shell',
    wordChars: '-$',
    completions: [
      ...words('keyword', 'if then else elif fi for in do done while until case esac function return exit local export readonly set shift'),
      ...words('function', 'echo printf read cd ls cat grep sed awk jq curl wget mkdir rm cp mv chmod tar zip unzip find xargs head tail sort uniq wc tee test az docker kubectl helm git dotnet npm pnpm node python'),
      ...words('variable', '$? $# $@ $0 $1 $HOME $PATH $PWD'),
      ...vso((t) => `echo ${t}`),
    ],
  },
  python: {
    name: 'Python',
    wordChars: '',
    completions: [
      ...words('keyword', 'def class if elif else for while try except finally with as import from return yield lambda pass break continue raise None True False and or not in is async await'),
      ...words('function', 'print len range open str int float dict list set tuple enumerate zip sorted isinstance'),
      ...vso((t) => `print(${t})`),
    ],
  },
};
